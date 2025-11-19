from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.appointment_model import Appointment


async def list_appointments(
    session: AsyncSession,
    *,
    user_id: int,
    time_min: Optional[datetime] = None,
    time_max: Optional[datetime] = None,
) -> Iterable[Appointment]:
    stmt = select(Appointment).where(
        or_(
            Appointment.patient_user_id == user_id,
            Appointment.doctor_user_id == user_id,
        )
    )

    if time_min is not None:
        stmt = stmt.where(Appointment.appointment_date >= time_min)
    if time_max is not None:
        stmt = stmt.where(Appointment.appointment_date <= time_max)

    stmt = stmt.order_by(Appointment.appointment_date.asc())

    result = await session.execute(stmt)
    return result.scalars().all()


async def create_appointment(
    session: AsyncSession,
    *,
    patient_user_id: Optional[int],
    doctor_user_id: Optional[int],
    clinic_id: Optional[int],
    appointment_date: datetime,
    duration_minutes: int,
    status: Optional[str],
    appointment_type: Optional[str],
    reason: Optional[str],
    notes: Optional[str],
) -> Appointment:
    if duration_minutes <= 0:
        duration_minutes = 30

    appointment = Appointment(
        patient_user_id=patient_user_id,
        doctor_user_id=doctor_user_id,
        clinic_id=clinic_id,
        appointment_date=appointment_date,
        duration_minutes=duration_minutes,
        status=status,
        appointment_type=appointment_type,
        reason=reason,
        notes=notes,
    )
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment


async def get_appointment_by_id(
    session: AsyncSession,
    appointment_id: int,
) -> Optional[Appointment]:
    stmt = select(Appointment).where(Appointment.appointment_id == appointment_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_appointment(
    session: AsyncSession,
    appointment_id: int,
    *,
    appointment_date: Optional[datetime] = None,
    duration_minutes: Optional[int] = None,
    status: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[Appointment]:
    appointment = await get_appointment_by_id(session, appointment_id)
    if not appointment:
        return None

    if appointment_date is not None:
        appointment.appointment_date = appointment_date
    if duration_minutes is not None:
        appointment.duration_minutes = duration_minutes
    if status is not None:
        appointment.status = status
    if notes is not None:
        appointment.notes = notes

    await session.commit()
    await session.refresh(appointment)
    return appointment