# db/crud/rag_file_crud.py  (or at bottom of your existing file)

from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.crud.patient_file_crud import FileBatch, PatientFile, FileBatchShare

# app/services/rag_access.py
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.patient_file_model import PatientFile, FileBatch, FileBatchShare


# PATIENT: ALL files for this patient (doctor uploads included)
async def fetch_patient_accessible_files(session: AsyncSession, patient_id: int):
    stmt = (
        select(PatientFile, FileBatch)
        .join(FileBatch)
        .where(FileBatch.patient_user_id == patient_id)
    )
    res = await session.execute(stmt)

    return [
        {
            "file_id": f.id,
            "file_url": f.file_url,
            "file_type": f.file_type.lower(),
            "file_name": f.file_name,
            "batch_id": b.id,
            "batch_category": b.category,
        }
        for f, b in res.all()
    ]


# DOCTOR: ONLY files explicitly shared with this doctor
async def fetch_doctor_accessible_files(session: AsyncSession, doctor_id: int):
    stmt = (
        select(PatientFile, FileBatch)
        .join(FileBatch)
        .join(FileBatchShare)
        .where(
            FileBatchShare.doctor_user_id == doctor_id,
            FileBatchShare.share_status == "active",
        )
    )
    res = await session.execute(stmt)

    return [
        {
            "file_id": f.id,
            "file_url": f.file_url,
            "file_type": f.file_type.lower(),
            "file_name": f.file_name,
            "batch_id": b.id,
            "batch_category": b.category,
        }
        for f, b in res.all()
    ]
