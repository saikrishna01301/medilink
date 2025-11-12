from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core import config
from db import get_session
from db.crud import auth_crud
from services import (
    verify_access_token,
    build_authorization_url,
    exchange_code,
    store_credentials,
    revoke_credentials,
    fetch_events,
    create_event,
)

router = APIRouter()


async def get_authenticated_user(
    access_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_session),
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = await verify_access_token(access_token)
    user_id = int(payload.get("sub"))
    user = await auth_crud.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/auth/url")
async def get_google_auth_url(
    request: Request,
    current_user=Depends(get_authenticated_user),
):
    url = await build_authorization_url(
        current_user.id,
        hostname=request.url.hostname,
    )
    return {"auth_url": url}


@router.get("/auth/callback")
async def google_auth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    session: AsyncSession = Depends(get_session),
):
    user_id, credentials = await exchange_code(
        code,
        state,
        hostname=request.url.hostname,
    )
    await store_credentials(
        session,
        user_id=user_id,
        credentials=credentials,
    )

    redirect_url = config.GOOGLE_OAUTH_SUCCESS_REDIRECT or "/"
    if redirect_url.startswith("http"):
        return RedirectResponse(url=redirect_url)
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.delete("/auth")
async def disconnect_google_calendar(
    current_user=Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    await revoke_credentials(
        session,
        user_id=current_user.id,
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"detail": "Google Calendar disconnected."},
    )


@router.get("/events")
async def list_google_events(
    current_user=Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
    time_min: str | None = Query(None),
    time_max: str | None = Query(None),
    include_holidays: bool = Query(False),
    max_results: int = Query(50, ge=1, le=2500),
):
    events = await fetch_events(
        session,
        user_id=current_user.id,
        time_min=time_min,
        time_max=time_max,
        max_results=max_results,
        include_holidays=include_holidays,
    )
    return events


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_google_event(
    event: dict,
    current_user=Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    created = await create_event(
        session,
        user_id=current_user.id,
        body=event,
    )
    return created

