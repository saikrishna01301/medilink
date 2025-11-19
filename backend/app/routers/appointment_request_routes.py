from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, time

from db import get_session
from db.crud import (
    auth_crud,
    appointment_request_crud,
    notification_crud,
    appointment_crud,
)
from schemas import (
    AppointmentRequestCreate,
    AppointmentRequestUpdate,
    AppointmentRequestRead,
    AppointmentRequestResponse,
)
from services import verify_access_token
from db.models.appointment_request_model import AppointmentRequestStatus

router = APIRouter()


def get_role_value(role) -> Optional[str]:
    """Extract role value from Enum or string"""
    if role is None:
        return None
    if hasattr(role, 'value'):
        return role.value
    return str(role)


async def get_authenticated_user(
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

    return user


@router.post("/", response_model=AppointmentRequestRead, status_code=status.HTTP_201_CREATED)
async def create_appointment_request(
    request_data: AppointmentRequestCreate,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new appointment request (patient only)"""
    if not current_user.is_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create appointment requests"
        )

    request = await appointment_request_crud.create_appointment_request(
        session,
        patient_user_id=current_user.id,
        doctor_user_id=request_data.doctor_user_id,
        clinic_id=request_data.clinic_id,
        preferred_date=request_data.preferred_date,
        preferred_time_slot_start=request_data.preferred_time_slot_start,
        is_flexible=request_data.is_flexible,
        reason=request_data.reason,
        notes=request_data.notes,
    )

    doctor = await auth_crud.get_user_by_id(request_data.doctor_user_id, session)
    doctor_name = f"{doctor.first_name} {doctor.last_name}".strip() if doctor else "Doctor"
    patient_name = f"{current_user.first_name} {current_user.last_name}".strip()

    await notification_crud.create_notification(
        session,
        user_id=request_data.doctor_user_id,
        type="appointment_request",
        title="New Appointment Request",
        message=f"{patient_name} has requested an appointment for {request_data.preferred_date.strftime('%Y-%m-%d')} at {request_data.preferred_time_slot_start.strftime('%H:%M')}",
        appointment_request_id=request.request_id,
        related_entity_type="appointment_request",
        related_entity_id=request.request_id,
    )

    return request


@router.get("/patient", response_model=List[AppointmentRequestRead])
async def list_patient_appointment_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """List appointment requests for the current patient"""
    if not current_user.is_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view their appointment requests"
        )

    requests = await appointment_request_crud.list_appointment_requests_for_patient(
        session,
        patient_user_id=current_user.id,
        status=status_filter,
    )
    return list(requests)


@router.get("/doctor", response_model=List[AppointmentRequestRead])
async def list_doctor_appointment_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """List appointment requests for the current doctor"""
    role_value = get_role_value(current_user.role)
    
    if role_value != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view appointment requests"
        )

    requests = await appointment_request_crud.list_appointment_requests_for_doctor(
        session,
        doctor_user_id=current_user.id,
        status=status_filter,
    )
    return list(requests)


@router.get("/{request_id}", response_model=AppointmentRequestRead)
async def get_appointment_request(
    request_id: int,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific appointment request"""
    request = await appointment_request_crud.get_appointment_request_by_id(
        session,
        request_id,
    )
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found"
        )

    if request.patient_user_id != current_user.id and request.doctor_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this appointment request"
        )

    return request


@router.patch("/{request_id}", response_model=AppointmentRequestRead)
async def update_appointment_request(
    request_id: int,
    update_data: AppointmentRequestUpdate,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Update an appointment request (doctor can accept/reject/suggest alternative, patient can accept/reject alternative)"""
    request = await appointment_request_crud.get_appointment_request_by_id(
        session,
        request_id,
    )
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found"
        )

    role_value = get_role_value(current_user.role)
    is_doctor = role_value == "doctor"
    is_patient = current_user.is_patient

    has_doctor_permission = is_doctor and request.doctor_user_id == current_user.id
    has_patient_permission = is_patient and request.patient_user_id == current_user.id

    if not (has_doctor_permission or has_patient_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this appointment request"
        )

    new_status = update_data.status
    doctor = await auth_crud.get_user_by_id(request.doctor_user_id, session)
    patient = await auth_crud.get_user_by_id(request.patient_user_id, session)
    doctor_name = f"{doctor.first_name} {doctor.last_name}".strip() if doctor else "Doctor"
    patient_name = f"{patient.first_name} {patient.last_name}".strip() if patient else "Patient"

    if has_doctor_permission:
        if new_status == "accepted":
            from datetime import timezone
            preferred_date_naive = request.preferred_date.replace(tzinfo=None) if request.preferred_date.tzinfo else request.preferred_date
            combined_datetime = datetime.combine(
                preferred_date_naive.date(),
                request.preferred_time_slot_start
            )
            if request.preferred_date.tzinfo:
                combined_datetime = combined_datetime.replace(tzinfo=request.preferred_date.tzinfo)
            appointment = await appointment_crud.create_appointment(
                session,
                patient_user_id=request.patient_user_id,
                doctor_user_id=request.doctor_user_id,
                clinic_id=request.clinic_id,
                appointment_date=combined_datetime,
                duration_minutes=30,
                status="scheduled",
                appointment_type="consultation",
                reason=request.reason,
                notes=request.notes,
            )
            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status=new_status,
                appointment_id=appointment.appointment_id,
                notes=update_data.notes,
            )

            await notification_crud.create_notification(
                session,
                user_id=request.patient_user_id,
                type="appointment_accepted",
                title="Appointment Accepted",
                message=f"{doctor_name} has accepted your appointment request for {request.preferred_date.strftime('%Y-%m-%d')} at {request.preferred_time_slot_start.strftime('%H:%M')}",
                appointment_request_id=request_id,
                appointment_id=appointment.appointment_id,
                related_entity_type="appointment",
                related_entity_id=appointment.appointment_id,
            )

        elif new_status == "rejected":
            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status=new_status,
                notes=update_data.notes,
            )

            await notification_crud.create_notification(
                session,
                user_id=request.patient_user_id,
                type="appointment_rejected",
                title="Appointment Request Rejected",
                message=f"{doctor_name} has rejected your appointment request for {request.preferred_date.strftime('%Y-%m-%d')} at {request.preferred_time_slot_start.strftime('%H:%M')}",
                appointment_request_id=request_id,
                related_entity_type="appointment_request",
                related_entity_id=request_id,
            )

        elif new_status == "doctor_suggested_alternative" and request.is_flexible:
            if not update_data.suggested_date or not update_data.suggested_time_slot_start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Suggested date and time slot are required when suggesting an alternative"
                )

            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status=new_status,
                suggested_date=update_data.suggested_date,
                suggested_time_slot_start=update_data.suggested_time_slot_start,
                notes=update_data.notes,
            )

            await notification_crud.create_notification(
                session,
                user_id=request.patient_user_id,
                type="appointment_suggested",
                title="Alternative Time Suggested",
                message=f"{doctor_name} has suggested an alternative time: {update_data.suggested_date.strftime('%Y-%m-%d')} at {update_data.suggested_time_slot_start.strftime('%H:%M')}",
                appointment_request_id=request_id,
                related_entity_type="appointment_request",
                related_entity_id=request_id,
            )

    elif has_patient_permission:
        # Patient can only accept or reject doctor-suggested alternatives
        # Convert status to string for comparison (handles enum values)
        current_status = str(request.status.value) if hasattr(request.status, 'value') else str(request.status) if request.status else ""
        current_status = current_status.strip()
        
        if new_status == "patient_accepted_alternative":
            # Patient accepts the doctor's suggested alternative time
            if current_status != "doctor_suggested_alternative":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can only accept alternative when doctor has suggested one"
                )
            
            if not request.suggested_date or not request.suggested_time_slot_start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No alternative time was suggested by the doctor"
                )

            # Combine suggested date and time into datetime
            suggested_date_naive = request.suggested_date.replace(tzinfo=None) if request.suggested_date.tzinfo else request.suggested_date
            combined_datetime = datetime.combine(
                suggested_date_naive.date(),
                request.suggested_time_slot_start
            )
            if request.suggested_date.tzinfo:
                combined_datetime = combined_datetime.replace(tzinfo=request.suggested_date.tzinfo)
            
            # Create appointment with suggested time
            appointment = await appointment_crud.create_appointment(
                session,
                patient_user_id=request.patient_user_id,
                doctor_user_id=request.doctor_user_id,
                clinic_id=request.clinic_id,
                appointment_date=combined_datetime,
                duration_minutes=30,
                status="scheduled",
                appointment_type="consultation",
                reason=request.reason,
                notes=request.notes,
            )
            
            # Update request status to "confirmed" and link appointment
            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status="confirmed",
                appointment_id=appointment.appointment_id,
            )

            # Notify doctor
            await notification_crud.create_notification(
                session,
                user_id=request.doctor_user_id,
                type="appointment_confirmed",
                title="Appointment Confirmed",
                message=f"{patient_name} has accepted your suggested alternative time. Appointment confirmed for {request.suggested_date.strftime('%Y-%m-%d')} at {request.suggested_time_slot_start.strftime('%H:%M')}",
                appointment_request_id=request_id,
                appointment_id=appointment.appointment_id,
                related_entity_type="appointment",
                related_entity_id=appointment.appointment_id,
            )

        elif new_status == "patient_rejected_alternative":
            # Patient rejects the doctor's suggested alternative time
            if current_status != "doctor_suggested_alternative":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can only reject alternative when doctor has suggested one"
                )
            
            # Update request status to "cancelled"
            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status="cancelled",
                notes=update_data.notes,
            )

            # Notify doctor
            await notification_crud.create_notification(
                session,
                user_id=request.doctor_user_id,
                type="appointment_cancelled",
                title="Alternative Time Rejected",
                message=f"{patient_name} has rejected your suggested alternative time. The appointment request has been cancelled.",
                appointment_request_id=request_id,
                related_entity_type="appointment_request",
                related_entity_id=request_id,
            )
        
        elif new_status == "cancelled":
            # Patient can cancel any appointment request (pending or confirmed)
            cancellation_note = f"Cancelled by patient. {update_data.notes or ''}".strip()
            
            # Update request status to "cancelled"
            await appointment_request_crud.update_appointment_request(
                session,
                request_id,
                status="cancelled",
                notes=cancellation_note,
            )
            
            # If there's a confirmed appointment, also cancel it
            if request.appointment_id:
                from db.crud import appointment_crud
                appointment = await appointment_crud.get_appointment_by_id(
                    session,
                    request.appointment_id,
                )
                if appointment:
                    await appointment_crud.update_appointment(
                        session,
                        request.appointment_id,
                        status="cancelled",
                        notes=cancellation_note,
                    )
            
            # Notify doctor
            await notification_crud.create_notification(
                session,
                user_id=request.doctor_user_id,
                type="appointment_cancelled",
                title="Appointment Cancelled by Patient",
                message=f"{patient_name} has cancelled the appointment request for {request.preferred_date.strftime('%Y-%m-%d')} at {request.preferred_time_slot_start.strftime('%H:%M')}.",
                appointment_request_id=request_id,
                appointment_id=request.appointment_id,
                related_entity_type="appointment_request" if not request.appointment_id else "appointment",
                related_entity_id=request.appointment_id or request_id,
            )
        
        else:
            # Patient cannot perform any other status updates
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status update for patient: {new_status}. Patients can accept/reject doctor-suggested alternatives or cancel appointments."
            )

    updated_request = await appointment_request_crud.get_appointment_request_by_id(
        session,
        request_id,
    )
    
    if not updated_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found after update"
        )
    
    # The Pydantic schema should handle enum conversion automatically,
    # but ensure we're returning the correct format
    return updated_request

