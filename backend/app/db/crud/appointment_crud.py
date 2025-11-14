from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.appointment_model import Appointment


async def list_appointments(
    session: AsyncSession,
    *,
    user_id: int,
    time_min: Optional[datetime] = None,
    time_max: Optional[datetime] = None,
) -> Iterable[Appointment]:
    stmt = select(Appointment).where(Appointment.user_id == user_id)

    if time_min is not None:
        stmt = stmt.where(Appointment.end_time >= time_min)
    if time_max is not None:
        stmt = stmt.where(Appointment.start_time <= time_max)

    stmt = stmt.order_by(Appointment.start_time.asc())

    result = await session.execute(stmt)
    return result.scalars().all()


async def create_appointment(
    session: AsyncSession,
    *,
    user_id: int,
    title: str,
    start_time: datetime,
    end_time: datetime,
    description: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    is_all_day: bool = False,
) -> Appointment:
    appointment = Appointment(
        user_id=user_id,
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
        category=category,
        location=location,
        is_all_day=is_all_day,
    )
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment

