from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from google.oauth2 import service_account
from googleapiclient.discovery import build

from core import config
from core.gcp_credentials import build_service_account_credentials

SERVICE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
_cached_credentials: Optional[service_account.Credentials] = None


def _require_service_credentials() -> service_account.Credentials:
    global _cached_credentials

    if _cached_credentials is None:
        credentials = build_service_account_credentials(
            config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON,
            config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH,
            config.GOOGLE_APPLICATION_CREDENTIALS_JSON,
            scopes=SERVICE_SCOPES,
        )

        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google service account credentials not configured. "
                "Provide GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH.",
            )

        _cached_credentials = credentials
    return _cached_credentials


async def _list_events(
    *,
    calendar_id: str,
    time_min: Optional[str],
    time_max: Optional[str],
    max_results: int,
) -> list[Dict[str, Any]]:
    credentials = _require_service_credentials()

    def _call() -> list[Dict[str, Any]]:
        service = build("calendar", "v3", credentials=credentials, cache_discovery=False)
        params: Dict[str, Any] = {
            "calendarId": calendar_id,
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": max_results,
        }
        if time_min:
            params["timeMin"] = time_min
        if time_max:
            params["timeMax"] = time_max
        response = service.events().list(**params).execute()
        return response.get("items", [])

    return await asyncio.to_thread(_call)


async def fetch_service_calendar_events(
    *,
    time_min: Optional[str],
    time_max: Optional[str],
    max_results: int,
) -> list[Dict[str, Any]]:
    calendar_id = config.GOOGLE_SERVICE_ACCOUNT_CALENDAR_ID
    if not calendar_id:
        return []
    return await _list_events(
        calendar_id=calendar_id,
        time_min=time_min,
        time_max=time_max,
        max_results=max_results,
    )


async def fetch_holiday_events(
    *,
    time_min: Optional[str],
    time_max: Optional[str],
    max_results: int,
) -> list[Dict[str, Any]]:
    calendar_id = config.GOOGLE_HOLIDAYS_CALENDAR_ID
    if not calendar_id:
        return []
    return await _list_events(
        calendar_id=calendar_id,
        time_min=time_min,
        time_max=time_max,
        max_results=max_results,
    )

