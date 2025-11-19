from __future__ import annotations

from datetime import datetime, time
from typing import Iterable, Optional

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.appointment_request_model import AppointmentRequest, AppointmentRequestStatus
from db.models.user_model import User


async def create_appointment_request(
    session: AsyncSession,
    *,
    patient_user_id: int,
    doctor_user_id: int,
    clinic_id: Optional[int],
    preferred_date: datetime,
    preferred_time_slot_start: time,
    is_flexible: bool,
    reason: Optional[str],
    notes: Optional[str],
) -> AppointmentRequest:
    request = AppointmentRequest(
        patient_user_id=patient_user_id,
        doctor_user_id=doctor_user_id,
        clinic_id=clinic_id,
        preferred_date=preferred_date,
        preferred_time_slot_start=preferred_time_slot_start,
        is_flexible=is_flexible,
        reason=reason,
        notes=notes,
        status=AppointmentRequestStatus.pending.value,
    )
    session.add(request)
    await session.commit()
    await session.refresh(request)
    return request


async def get_appointment_request_by_id(
    session: AsyncSession,
    request_id: int,
) -> Optional[AppointmentRequest]:
    stmt = select(AppointmentRequest).where(AppointmentRequest.request_id == request_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_appointment_requests_for_patient(
    session: AsyncSession,
    patient_user_id: int,
    status: Optional[str] = None,
) -> Iterable[AppointmentRequest]:
    stmt = select(AppointmentRequest).where(
        AppointmentRequest.patient_user_id == patient_user_id
    )
    if status:
        stmt = stmt.where(AppointmentRequest.status == status)
    stmt = stmt.order_by(AppointmentRequest.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()


async def list_appointment_requests_for_doctor(
    session: AsyncSession,
    doctor_user_id: int,
    status: Optional[str] = None,
) -> Iterable[AppointmentRequest]:
    stmt = select(AppointmentRequest).where(
        AppointmentRequest.doctor_user_id == doctor_user_id
    )
    if status:
        stmt = stmt.where(AppointmentRequest.status == status)
    stmt = stmt.order_by(AppointmentRequest.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()


async def update_appointment_request(
    session: AsyncSession,
    request_id: int,
    *,
    status: Optional[str] = None,
    preferred_date: Optional[datetime] = None,
    preferred_time_slot_start: Optional[time] = None,
    suggested_date: Optional[datetime] = None,
    suggested_time_slot_start: Optional[time] = None,
    notes: Optional[str] = None,
    appointment_id: Optional[int] = None,
) -> Optional[AppointmentRequest]:
    request = await get_appointment_request_by_id(session, request_id)
    if not request:
        return None

    if status is not None:
        request.status = status
    if preferred_date is not None:
        request.preferred_date = preferred_date
    if preferred_time_slot_start is not None:
        request.preferred_time_slot_start = preferred_time_slot_start
    if suggested_date is not None:
        request.suggested_date = suggested_date
    if suggested_time_slot_start is not None:
        request.suggested_time_slot_start = suggested_time_slot_start
    if notes is not None:
        request.notes = notes
    if appointment_id is not None:
        request.appointment_id = appointment_id

    await session.commit()
    await session.refresh(request)
    return request


async def get_appointment_requests_with_users(
    session: AsyncSession,
    user_id: int,
    is_patient: bool = True,
) -> Iterable[AppointmentRequest]:
    if is_patient:
        stmt = select(AppointmentRequest).where(
            AppointmentRequest.patient_user_id == user_id
        )
    else:
        stmt = select(AppointmentRequest).where(
            AppointmentRequest.doctor_user_id == user_id
        )
    stmt = stmt.order_by(AppointmentRequest.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()

