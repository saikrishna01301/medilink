from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_session
from db.crud import auth_crud, appointment_crud
from schemas.appointment_schema import AppointmentCreate, AppointmentRead
from services import (
    fetch_holiday_events,
    fetch_service_calendar_events,
    verify_access_token,
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


def _parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    if value is None:
        return None

    sanitized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(sanitized)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO datetime value: {value}",
        ) from exc


def _serialize_appointment(model) -> dict:
    return AppointmentRead.model_validate(model).model_dump(mode="json")


def _normalize_event(event: dict) -> dict:
    return {
        "id": event.get("id"),
        "summary": event.get("summary"),
        "description": event.get("description"),
        "start": event.get("start"),
        "end": event.get("end"),
        "location": event.get("location"),
    }


@router.get("/events")
async def list_calendar_events(
    current_user=Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
    time_min: str | None = Query(None),
    time_max: str | None = Query(None),
    include_holidays: bool = Query(False),
    max_results: int = Query(50, ge=1, le=2500),
):
    start_dt = _parse_iso_datetime(time_min)
    end_dt = _parse_iso_datetime(time_max)

    appointments = await appointment_crud.list_appointments(
        session,
        user_id=current_user.id,
        time_min=start_dt,
        time_max=end_dt,
    )

    response: dict = {
        "appointments": [_serialize_appointment(item) for item in appointments],
        "holidays": [],
        "service_events": [],
    }

    if include_holidays:
        holidays = await fetch_holiday_events(
            time_min=time_min,
            time_max=time_max,
            max_results=max_results,
        )
        response["holidays"] = [_normalize_event(event) for event in holidays]

    service_events = await fetch_service_calendar_events(
        time_min=time_min,
        time_max=time_max,
        max_results=max_results,
    )
    response["service_events"] = [_normalize_event(event) for event in service_events]

    return response


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    payload: AppointmentCreate,
    current_user=Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time.",
        )

    created = await appointment_crud.create_appointment(
        session,
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        category=payload.category,
        location=payload.location,
        is_all_day=payload.is_all_day,
    )

    return _serialize_appointment(created)

