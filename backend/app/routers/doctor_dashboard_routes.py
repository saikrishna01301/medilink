from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta
from typing import Dict, Any

from db import get_session
from db.crud import auth_crud, appointment_crud, appointment_request_crud
from db.models.appointment_model import Appointment
from db.models.appointment_request_model import AppointmentRequest
from services import verify_access_token

router = APIRouter()


async def get_authenticated_doctor(
    access_token: str = Cookie(None), session: AsyncSession = Depends(get_session)
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
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    role_value = user.role.value if hasattr(user.role, 'value') else str(user.role) if user.role else None
    if role_value != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to doctors"
        )

    return user


@router.get("/dashboard/stats", response_model=Dict[str, Any])
async def get_doctor_dashboard_stats(
    current_user = Depends(get_authenticated_doctor),
    session: AsyncSession = Depends(get_session),
):
    """Get dashboard statistics for the current doctor"""
    now = datetime.utcnow()
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    completed_count_stmt = select(func.count(Appointment.appointment_id)).where(
        and_(
            Appointment.doctor_user_id == current_user.id,
            Appointment.status == "completed",
        )
    )
    completed_result = await session.execute(completed_count_stmt)
    completed_appointments = completed_result.scalar() or 0

    upcoming_count_stmt = select(func.count(Appointment.appointment_id)).where(
        and_(
            Appointment.doctor_user_id == current_user.id,
            Appointment.appointment_date >= now,
            Appointment.status.in_(["scheduled", "confirmed"]),
        )
    )
    upcoming_result = await session.execute(upcoming_count_stmt)
    upcoming_appointments = upcoming_result.scalar() or 0

    pending_requests_stmt = select(func.count(AppointmentRequest.request_id)).where(
        and_(
            AppointmentRequest.doctor_user_id == current_user.id,
            AppointmentRequest.status == "pending",
        )
    )
    pending_requests_result = await session.execute(pending_requests_stmt)
    pending_requests = pending_requests_result.scalar() or 0

    total_appointments_stmt = select(func.count(Appointment.appointment_id)).where(
        and_(
            Appointment.doctor_user_id == current_user.id,
            Appointment.appointment_date >= start_of_week,
        )
    )
    total_appointments_result = await session.execute(total_appointments_stmt)
    total_appointments = total_appointments_result.scalar() or 0

    cancelled_appointments_stmt = select(func.count(Appointment.appointment_id)).where(
        and_(
            Appointment.doctor_user_id == current_user.id,
            Appointment.status == "cancelled",
            Appointment.appointment_date >= start_of_week,
        )
    )
    cancelled_result = await session.execute(cancelled_appointments_stmt)
    cancelled_appointments = cancelled_result.scalar() or 0

    reschedule_requests_stmt = select(func.count(AppointmentRequest.request_id)).where(
        and_(
            AppointmentRequest.doctor_user_id == current_user.id,
            AppointmentRequest.status == "doctor_suggested_alternative",
        )
    )
    reschedule_result = await session.execute(reschedule_requests_stmt)
    reschedule_requests = reschedule_result.scalar() or 0

    unique_patients_stmt = select(func.count(func.distinct(Appointment.patient_user_id))).where(
        and_(
            Appointment.doctor_user_id == current_user.id,
            Appointment.appointment_date >= start_of_week,
            Appointment.patient_user_id.isnot(None),
        )
    )
    unique_patients_result = await session.execute(unique_patients_stmt)
    unique_patients = unique_patients_result.scalar() or 0

    return {
        "completed_appointments": completed_appointments,
        "upcoming_appointments": upcoming_appointments,
        "pending_requests": pending_requests,
        "total_appointments_this_week": total_appointments,
        "cancelled_appointments_this_week": cancelled_appointments,
        "reschedule_requests": reschedule_requests,
        "unique_patients_this_week": unique_patients,
    }

