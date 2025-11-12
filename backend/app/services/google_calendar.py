from __future__ import annotations

import asyncio
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, status
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from jose import jwt, JWTError

from core import config
from db.crud import google_calendar_crud

TOKEN_URI = "https://oauth2.googleapis.com/token"
STATE_TTL_MINUTES = 10


def _scopes() -> list[str]:
    scopes = [scope.strip() for scope in config.GOOGLE_OAUTH_SCOPES.split() if scope.strip()]
    return scopes or ["https://www.googleapis.com/auth/calendar.readonly"]


def _redirect_uri(hostname: Optional[str]) -> str:
    if hostname and ("localhost" in hostname or hostname.startswith("127.")):
        return config.GOOGLE_OAUTH_DEV_REDIRECT_URI or config.GOOGLE_OAUTH_REDIRECT_URI
    return config.GOOGLE_OAUTH_REDIRECT_URI or config.GOOGLE_OAUTH_DEV_REDIRECT_URI


def _flow(redirect_uri: str, state: Optional[str] = None) -> Flow:
    if not config.GOOGLE_OAUTH_CREDENTIALS_PATH:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials path not configured.",
        )
    return Flow.from_client_secrets_file(
        config.GOOGLE_OAUTH_CREDENTIALS_PATH,
        scopes=_scopes(),
        redirect_uri=redirect_uri,
        state=state,
    )


def _encode_state(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=STATE_TTL_MINUTES),
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, config.JWT_ALGORITHM)


def _decode_state(state_token: str) -> int:
    try:
        payload = jwt.decode(
            state_token,
            config.JWT_SECRET_KEY,
            algorithms=[config.JWT_ALGORITHM],
        )
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state parameter.",
        ) from exc


async def build_authorization_url(
    user_id: int,
    *,
    hostname: Optional[str],
) -> str:
    state_token = _encode_state(user_id)
    redirect_uri = _redirect_uri(hostname)
    flow = _flow(redirect_uri, state=state_token)
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return authorization_url


async def exchange_code(
    code: str,
    state_token: str,
    *,
    hostname: Optional[str],
) -> Tuple[int, Credentials]:
    user_id = _decode_state(state_token)
    redirect_uri = _redirect_uri(hostname)
    flow = _flow(redirect_uri, state=state_token)
    flow.fetch_token(code=code)
    return user_id, flow.credentials


async def store_credentials(
    session,
    *,
    user_id: int,
    credentials: Credentials,
):
    await google_calendar_crud.upsert_credentials(
        session,
        user_id=user_id,
        access_token=credentials.token,
        refresh_token=credentials.refresh_token,
        token_type=credentials.token_type,
        expires_at=credentials.expiry,
        scope=" ".join(credentials.scopes or []),
        raw_credentials=credentials.to_json(),
    )


async def load_credentials(session, *, user_id: int) -> Optional[Credentials]:
    stored = await google_calendar_crud.get_credentials(session, user_id=user_id)
    if not stored:
        return None

    credentials = Credentials(
        token=stored.access_token,
        refresh_token=stored.refresh_token,
        token_uri=TOKEN_URI,
        client_id=config.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=config.GOOGLE_OAUTH_CLIENT_SECRET,
        scopes=_scopes(),
    )
    if stored.expires_at:
        credentials.expiry = stored.expires_at

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(GoogleRequest())
        await store_credentials(
            session,
            user_id=user_id,
            credentials=credentials,
        )

    return credentials


async def revoke_credentials(session, *, user_id: int) -> None:
    await google_calendar_crud.delete_credentials(session, user_id=user_id)


async def fetch_events(
    session,
    *,
    user_id: int,
    calendar_id: str = "primary",
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    max_results: int = 20,
    include_holidays: bool = False,
) -> Dict[str, list[Dict]]:
    credentials = await load_credentials(session, user_id=user_id)
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar is not connected for this user.",
        )

    service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
    events_resource = service.events()

    def _list_events(calendar: str) -> list[Dict]:
        params: Dict[str, str | int] = {
            "calendarId": calendar,
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": max_results,
        }
        if time_min:
            params["timeMin"] = time_min
        if time_max:
            params["timeMax"] = time_max
        response = events_resource.list(**params).execute()
        return response.get("items", [])

    primary_events = _list_events(calendar_id)
    holiday_events: list[Dict] = []
    if include_holidays:
        holiday_events = _list_events(config.GOOGLE_HOLIDAYS_CALENDAR_ID)

    return {"primary": primary_events, "holidays": holiday_events}


async def create_event(
    session,
    *,
    user_id: int,
    calendar_id: str = "primary",
    body: Dict[str, Any],
) -> Dict[str, Any]:
    credentials = await load_credentials(session, user_id=user_id)
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar is not connected for this user.",
        )

    service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
    created = (
        service.events()
        .insert(calendarId=calendar_id, body=body, supportsAttachments=False)
        .execute()
    )
    return created

