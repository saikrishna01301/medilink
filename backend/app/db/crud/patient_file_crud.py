from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from db.models.patient_file_model import FileBatch, PatientFile, FileBatchCategory, FileBatchShare
from db.models.user_model import User
from db.models.doctor_model import DoctorProfile
from db.models.appointment_model import Appointment
from db.models.appointment_request_model import AppointmentRequest, AppointmentRequestStatus


async def create_file_batch(
    patient_user_id: int,
    category: str,
    heading: Optional[str],
    session: AsyncSession
) -> FileBatch:
    """Create a new file batch"""
    batch = FileBatch(
        patient_user_id=patient_user_id,
        category=category,
        heading=heading,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    session.add(batch)
    await session.commit()
    await session.refresh(batch)
    return batch


async def create_patient_file(
    file_batch_id: int,
    file_name: str,
    file_url: str,
    file_type: str,
    file_size: int,
    session: AsyncSession
) -> PatientFile:
    """Create a new patient file"""
    file = PatientFile(
        file_batch_id=file_batch_id,
        file_name=file_name,
        file_url=file_url,
        file_type=file_type,
        file_size=file_size,
        created_at=datetime.now(timezone.utc)
    )
    session.add(file)
    await session.commit()
    await session.refresh(file)
    return file


async def get_file_batch(
    batch_id: int,
    patient_user_id: int,
    session: AsyncSession
) -> Optional[FileBatch]:
    """Get a file batch by ID (ensuring it belongs to the patient)"""
    result = await session.scalar(
        select(FileBatch)
        .where(
            FileBatch.id == batch_id,
            FileBatch.patient_user_id == patient_user_id
        )
        .options(selectinload(FileBatch.files))
    )
    return result


async def list_file_batches(
    patient_user_id: int,
    category: Optional[str] = None,
    session: AsyncSession = None
) -> List[FileBatch]:
    """List all file batches for a patient, optionally filtered by category, ordered by created_at DESC"""
    stmt = select(FileBatch).where(FileBatch.patient_user_id == patient_user_id)
    
    if category:
        stmt = stmt.where(FileBatch.category == category)
    
    stmt = stmt.options(selectinload(FileBatch.files)).order_by(desc(FileBatch.created_at))
    
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_patient_file(
    file_id: int,
    patient_user_id: int,
    session: AsyncSession
) -> Optional[PatientFile]:
    """Get a patient file by ID (ensuring it belongs to the patient's batch)"""
    result = await session.scalar(
        select(PatientFile)
        .join(FileBatch)
        .where(
            PatientFile.id == file_id,
            FileBatch.patient_user_id == patient_user_id
        )
    )
    return result


async def delete_file_batch(
    batch_id: int,
    patient_user_id: int,
    session: AsyncSession
) -> bool:
    """Delete a file batch (and its files via cascade)"""
    batch = await get_file_batch(batch_id, patient_user_id, session)
    if batch:
        await session.delete(batch)
        await session.commit()
        return True
    return False


async def delete_patient_file(
    file_id: int,
    patient_user_id: int,
    session: AsyncSession
) -> bool:
    """Delete a patient file"""
    file = await get_patient_file(file_id, patient_user_id, session)
    if file:
        await session.delete(file)
        await session.commit()
        return True
    return False


CONFIRMED_APPOINTMENT_STATUSES = {"confirmed", "scheduled"}
PENDING_REQUEST_STATUSES = {
    AppointmentRequestStatus.pending.value,
    AppointmentRequestStatus.doctor_suggested_alternative.value,
    AppointmentRequestStatus.patient_accepted_alternative.value,
}


def _format_full_name(user: Optional[User]) -> str:
    if not user:
        return ""
    parts = [user.first_name, user.middle_name, user.last_name]
    return " ".join([p for p in parts if p]).strip()


async def get_file_batch_with_files(
    batch_id: int,
    patient_user_id: int,
    session: AsyncSession
) -> Optional[Dict[str, Any]]:
    """Get a file batch with its files as a dictionary"""
    batch = await get_file_batch(batch_id, patient_user_id, session)
    if not batch:
        return None
    
    return {
        "id": batch.id,
        "patient_user_id": batch.patient_user_id,
        "category": batch.category,
        "heading": batch.heading,
        "created_at": batch.created_at.isoformat(),
        "updated_at": batch.updated_at.isoformat(),
        "files": [
            {
                "id": file.id,
                "file_name": file.file_name,
                "file_url": file.file_url,
                "file_type": file.file_type,
                "file_size": file.file_size,
                "created_at": file.created_at.isoformat(),
            }
            for file in sorted(batch.files, key=lambda f: f.created_at, reverse=True)
        ]
    }


async def list_shareable_doctors(
    patient_user_id: int,
    session: AsyncSession
) -> List[Dict[str, Any]]:
    """Return doctors that the patient can share lab reports with."""
    doctor_map: Dict[int, Dict[str, Any]] = {}

    appointment_stmt = (
        select(Appointment, User, DoctorProfile)
        .join(User, User.id == Appointment.doctor_user_id)
        .outerjoin(DoctorProfile, DoctorProfile.user_id == User.id)
        .where(
            Appointment.patient_user_id == patient_user_id,
            Appointment.doctor_user_id.is_not(None),
        )
        .order_by(desc(Appointment.appointment_date))
    )
    appointment_results = await session.execute(appointment_stmt)
    for appointment, doctor_user, doctor_profile in appointment_results.all():
        if not doctor_user:
            continue
        status = (appointment.status or "").lower()
        if status not in CONFIRMED_APPOINTMENT_STATUSES:
            continue
        priority = 2
        sort_key = appointment.appointment_date or appointment.created_at or datetime.now(timezone.utc)
        existing = doctor_map.get(doctor_user.id)
        if existing and (existing["priority"] > priority or (existing["priority"] == priority and existing["sort_key"] >= sort_key)):
            continue
        doctor_map[doctor_user.id] = {
            "doctor_user_id": doctor_user.id,
            "doctor_name": _format_full_name(doctor_user),
            "doctor_photo_url": getattr(doctor_profile, "photo_url", None),
            "doctor_specialty": getattr(doctor_profile, "specialty", None),
            "relationship_type": "appointment",
            "appointment_id": appointment.appointment_id,
            "appointment_status": appointment.status,
            "appointment_date": appointment.appointment_date.isoformat(),
            "appointment_request_id": None,
            "appointment_request_status": None,
            "appointment_request_preferred_date": None,
            "priority": priority,
            "sort_key": sort_key,
        }

    request_stmt = (
        select(AppointmentRequest, User, DoctorProfile)
        .join(User, User.id == AppointmentRequest.doctor_user_id)
        .outerjoin(DoctorProfile, DoctorProfile.user_id == User.id)
        .where(AppointmentRequest.patient_user_id == patient_user_id)
        .order_by(desc(AppointmentRequest.preferred_date))
    )
    request_results = await session.execute(request_stmt)
    for request, doctor_user, doctor_profile in request_results.all():
        if not doctor_user:
            continue
        if request.status not in PENDING_REQUEST_STATUSES:
            continue
        priority = 1
        sort_key = request.preferred_date or request.created_at or datetime.now(timezone.utc)
        existing = doctor_map.get(doctor_user.id)
        if existing and existing["priority"] >= priority:
            continue
        doctor_map[doctor_user.id] = {
            "doctor_user_id": doctor_user.id,
            "doctor_name": _format_full_name(doctor_user),
            "doctor_photo_url": getattr(doctor_profile, "photo_url", None),
            "doctor_specialty": getattr(doctor_profile, "specialty", None),
            "relationship_type": "appointment_request",
            "appointment_id": None,
            "appointment_status": None,
            "appointment_date": None,
            "appointment_request_id": request.request_id,
            "appointment_request_status": request.status,
            "appointment_request_preferred_date": request.preferred_date.isoformat() if request.preferred_date else None,
            "priority": priority,
            "sort_key": sort_key,
        }

    doctor_list = list(doctor_map.values())
    doctor_list.sort(
        key=lambda item: (
            -item["priority"],
            item["sort_key"] if isinstance(item["sort_key"], datetime) else datetime.now(timezone.utc),
            item["doctor_name"].lower() if item["doctor_name"] else "",
        )
    )
    for entry in doctor_list:
        entry.pop("priority", None)
        entry.pop("sort_key", None)
    return doctor_list


async def upsert_file_batch_share(
    *,
    file_batch_id: int,
    patient_user_id: int,
    doctor_user_id: int,
    appointment_id: Optional[int],
    appointment_request_id: Optional[int],
    session: AsyncSession,
) -> FileBatchShare:
    """Create or update a file batch share record."""
    stmt = select(FileBatchShare).where(
        FileBatchShare.file_batch_id == file_batch_id,
        FileBatchShare.patient_user_id == patient_user_id,
        FileBatchShare.doctor_user_id == doctor_user_id,
        FileBatchShare.appointment_id == appointment_id,
        FileBatchShare.appointment_request_id == appointment_request_id,
    )
    existing = await session.scalar(stmt)
    now = datetime.now(timezone.utc)
    if existing:
        existing.share_status = "active"
        existing.revoked_at = None
        existing.shared_at = now
        existing.updated_at = now
        await session.commit()
        await session.refresh(existing)
        return existing

    share = FileBatchShare(
        file_batch_id=file_batch_id,
        patient_user_id=patient_user_id,
        doctor_user_id=doctor_user_id,
        appointment_id=appointment_id,
        appointment_request_id=appointment_request_id,
        share_status="active",
        shared_at=now,
        updated_at=now,
    )
    session.add(share)
    await session.commit()
    await session.refresh(share)
    return share


async def get_file_batch_share_by_id(
    share_id: int,
    session: AsyncSession
) -> Optional[FileBatchShare]:
    stmt = (
        select(FileBatchShare)
        .where(FileBatchShare.id == share_id)
        .options(
            selectinload(FileBatchShare.batch).selectinload(FileBatch.files),
            selectinload(FileBatchShare.patient),
            selectinload(FileBatchShare.doctor).selectinload(User.doctor_profile),
            selectinload(FileBatchShare.appointment),
            selectinload(FileBatchShare.appointment_request),
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_file_batch_shares_for_doctor(
    doctor_user_id: int,
    session: AsyncSession
) -> List[FileBatchShare]:
    stmt = (
        select(FileBatchShare)
        .where(
            FileBatchShare.doctor_user_id == doctor_user_id,
            FileBatchShare.share_status == "active",
        )
        .options(
            selectinload(FileBatchShare.batch).selectinload(FileBatch.files),
            selectinload(FileBatchShare.patient),
            selectinload(FileBatchShare.doctor).selectinload(User.doctor_profile),
            selectinload(FileBatchShare.appointment),
            selectinload(FileBatchShare.appointment_request),
        )
        .order_by(desc(FileBatchShare.shared_at))
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


def serialize_file_batch_share(share: FileBatchShare) -> Dict[str, Any]:
    batch = share.batch
    patient = share.patient
    doctor = share.doctor
    doctor_profile = getattr(doctor, "doctor_profile", None) if doctor else None

    files: List[Dict[str, Any]] = []
    if batch and batch.files:
        files = [
            {
                "id": file.id,
                "file_name": file.file_name,
                "file_url": file.file_url,
                "file_type": file.file_type,
                "file_size": file.file_size,
                "created_at": file.created_at.isoformat(),
            }
            for file in sorted(batch.files, key=lambda f: f.created_at, reverse=True)
        ]

    appointment_date = share.appointment.appointment_date.isoformat() if share.appointment and share.appointment.appointment_date else None
    request_date = share.appointment_request.preferred_date.isoformat() if share.appointment_request and share.appointment_request.preferred_date else None

    return {
        "share_id": share.id,
        "file_batch_id": share.file_batch_id,
        "batch_heading": batch.heading if batch else None,
        "batch_category": batch.category if batch else None,
        "share_status": share.share_status,
        "shared_at": share.shared_at.isoformat() if share.shared_at else None,
        "patient_user_id": share.patient_user_id,
        "patient_name": _format_full_name(patient),
        "doctor_user_id": share.doctor_user_id,
        "doctor_name": _format_full_name(doctor),
        "doctor_photo_url": getattr(doctor_profile, "photo_url", None),
        "doctor_specialty": getattr(doctor_profile, "specialty", None),
        "appointment_id": share.appointment_id,
        "appointment_status": share.appointment.status if share.appointment else None,
        "appointment_date": appointment_date,
        "appointment_request_id": share.appointment_request_id,
        "appointment_request_status": share.appointment_request.status if share.appointment_request else None,
        "appointment_request_preferred_date": request_date,
        "files": files,
    }

