from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db import Specialty, DoctorSpecialty
from typing import List, Optional, Dict, Any


async def get_all_specialties(session: AsyncSession) -> List[Specialty]:
    """Get all available specialties."""
    result = await session.execute(select(Specialty).order_by(Specialty.label))
    return list(result.scalars().all())


async def get_specialty_by_id(specialty_id: int, session: AsyncSession) -> Optional[Specialty]:
    """Get a specialty by ID."""
    result = await session.execute(select(Specialty).where(Specialty.id == specialty_id))
    return result.scalar_one_or_none()


async def get_specialty_by_value(value: str, session: AsyncSession) -> Optional[Specialty]:
    """Get a specialty by its value (e.g., 'family_medicine_physician')."""
    result = await session.execute(select(Specialty).where(Specialty.value == value))
    return result.scalar_one_or_none()


async def get_doctor_specialties(doctor_user_id: int, session: AsyncSession) -> List[DoctorSpecialty]:
    """Get all specialties for a doctor."""
    result = await session.execute(
        select(DoctorSpecialty)
        .where(DoctorSpecialty.doctor_user_id == doctor_user_id)
        .order_by(DoctorSpecialty.is_primary.desc(), DoctorSpecialty.created_at)
    )
    return list(result.scalars().all())


async def get_primary_specialty(doctor_user_id: int, session: AsyncSession) -> Optional[DoctorSpecialty]:
    """Get the primary specialty for a doctor."""
    result = await session.execute(
        select(DoctorSpecialty)
        .where(
            DoctorSpecialty.doctor_user_id == doctor_user_id,
            DoctorSpecialty.is_primary == True
        )
        .limit(1)
    )
    return result.scalar_one_or_none()


async def add_doctor_specialty(
    doctor_user_id: int,
    specialty_id: int,
    is_primary: bool = False,
    session: AsyncSession = None
) -> DoctorSpecialty:
    """Add a specialty to a doctor."""
    if is_primary:
        await clear_primary_specialty(doctor_user_id, session)
    
    existing = await session.execute(
        select(DoctorSpecialty).where(
            DoctorSpecialty.doctor_user_id == doctor_user_id,
            DoctorSpecialty.specialty_id == specialty_id
        )
    )
    existing_ds = existing.scalar_one_or_none()
    
    if existing_ds:
        existing_ds.is_primary = is_primary
        await session.commit()
        await session.refresh(existing_ds)
        return existing_ds
    
    doctor_specialty = DoctorSpecialty(
        doctor_user_id=doctor_user_id,
        specialty_id=specialty_id,
        is_primary=is_primary
    )
    session.add(doctor_specialty)
    await session.commit()
    await session.refresh(doctor_specialty)
    return doctor_specialty


async def remove_doctor_specialty(
    doctor_user_id: int,
    specialty_id: int,
    session: AsyncSession
) -> bool:
    """Remove a specialty from a doctor."""
    result = await session.execute(
        select(DoctorSpecialty).where(
            DoctorSpecialty.doctor_user_id == doctor_user_id,
            DoctorSpecialty.specialty_id == specialty_id
        )
    )
    doctor_specialty = result.scalar_one_or_none()
    
    if doctor_specialty:
        await session.delete(doctor_specialty)
        await session.commit()
        return True
    return False


async def set_primary_specialty(
    doctor_user_id: int,
    specialty_id: int,
    session: AsyncSession
) -> Optional[DoctorSpecialty]:
    """Set a specialty as the primary specialty for a doctor."""
    await clear_primary_specialty(doctor_user_id, session)
    
    result = await session.execute(
        select(DoctorSpecialty).where(
            DoctorSpecialty.doctor_user_id == doctor_user_id,
            DoctorSpecialty.specialty_id == specialty_id
        )
    )
    doctor_specialty = result.scalar_one_or_none()
    
    if doctor_specialty:
        doctor_specialty.is_primary = True
        await session.commit()
        await session.refresh(doctor_specialty)
        return doctor_specialty
    
    doctor_specialty = DoctorSpecialty(
        doctor_user_id=doctor_user_id,
        specialty_id=specialty_id,
        is_primary=True
    )
    session.add(doctor_specialty)
    await session.commit()
    await session.refresh(doctor_specialty)
    return doctor_specialty


async def clear_primary_specialty(doctor_user_id: int, session: AsyncSession) -> None:
    """Clear the primary specialty flag for all specialties of a doctor."""
    result = await session.execute(
        select(DoctorSpecialty).where(
            DoctorSpecialty.doctor_user_id == doctor_user_id,
            DoctorSpecialty.is_primary == True
        )
    )
    for doctor_specialty in result.scalars().all():
        doctor_specialty.is_primary = False
    await session.commit()


async def update_doctor_specialties(
    doctor_user_id: int,
    specialty_ids: List[int],
    primary_specialty_id: Optional[int] = None,
    session: AsyncSession = None
) -> List[DoctorSpecialty]:
    """Update all specialties for a doctor. Replaces existing specialties."""
    existing_result = await session.execute(
        select(DoctorSpecialty).where(DoctorSpecialty.doctor_user_id == doctor_user_id)
    )
    existing = list(existing_result.scalars().all())
    
    existing_specialty_ids = {ds.specialty_id for ds in existing}
    new_specialty_ids = set(specialty_ids)
    
    to_remove = existing_specialty_ids - new_specialty_ids
    to_add = new_specialty_ids - existing_specialty_ids
    
    if primary_specialty_id:
        await clear_primary_specialty(doctor_user_id, session)
    
    for doctor_specialty in existing:
        if doctor_specialty.specialty_id in to_remove:
            await session.delete(doctor_specialty)
        elif doctor_specialty.specialty_id in new_specialty_ids:
            doctor_specialty.is_primary = (doctor_specialty.specialty_id == primary_specialty_id)
    
    for specialty_id in to_add:
        is_primary = (specialty_id == primary_specialty_id)
        doctor_specialty = DoctorSpecialty(
            doctor_user_id=doctor_user_id,
            specialty_id=specialty_id,
            is_primary=is_primary
        )
        session.add(doctor_specialty)
    
    await session.commit()
    
    result = await session.execute(
        select(DoctorSpecialty).where(DoctorSpecialty.doctor_user_id == doctor_user_id)
    )
    return list(result.scalars().all())

