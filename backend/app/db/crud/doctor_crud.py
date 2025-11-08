from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from db import DoctorProfile, User
from db.models.user_model import UserRoleEnum
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone


async def get_doctor_profile(user_id: int, session: AsyncSession) -> Optional[DoctorProfile]:
    """Get doctor profile by user_id"""
    result = await session.execute(
        select(DoctorProfile)
        .where(DoctorProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_doctor_profile_with_clinics(user_id: int, session: AsyncSession) -> Dict[str, Any]:
    """Get doctor profile with user info (simplified, no clinics)"""
    # Get user
    user = await session.scalar(
        select(User).where(User.id == user_id)
    )
    
    if not user:
        return None
    
    # Get profile
    profile = await get_doctor_profile(user_id, session)
    
    return {
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "emergency_contact": user.emergency_contact,
        },
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "specialty": profile.specialty,
            "bio": profile.bio,
            "photo_url": profile.photo_url,
            "years_of_experience": profile.years_of_experience,
            "medical_license_number": profile.medical_license_number,
            "board_certifications": profile.board_certifications,
            "languages_spoken": profile.languages_spoken,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        } if profile else None,
        "clinics": [],  # Empty list for compatibility
    }


async def create_doctor_profile(profile_data: dict, user_id: int, session: AsyncSession) -> DoctorProfile:
    """Create a new doctor profile"""
    profile = DoctorProfile(**profile_data, user_id=user_id)
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def update_doctor_profile(
    user_id: int, 
    profile_data: dict, 
    session: AsyncSession
) -> Optional[DoctorProfile]:
    """Update doctor profile"""
    profile = await get_doctor_profile(user_id, session)
    
    if not profile:
        return None
    
    # Update fields (allow explicit clearing by passing None)
    for key, value in profile_data.items():
        setattr(profile, key, value)
    
    profile.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(profile)
    return profile


async def update_user_info(
    user_id: int,
    user_data: dict,
    session: AsyncSession
) -> Optional[User]:
    """Update user basic information"""
    user = await session.scalar(select(User).where(User.id == user_id))
    
    if not user:
        return None
    
    # Update fields
    for key, value in user_data.items():
        if value is not None:  # Only update provided fields
            setattr(user, key, value)
    
    user.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(user)
    return user


async def list_doctors_with_profiles(
    session: AsyncSession,
    *,
    search: Optional[str] = None,
    specialty: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return all doctors with their profile information."""
    stmt = (
        select(User, DoctorProfile)
        .join(DoctorProfile, DoctorProfile.user_id == User.id, isouter=True)
        .where(User.role == UserRoleEnum.doctor)
        .order_by(func.lower(User.last_name), func.lower(User.first_name))
    )

    if specialty:
        stmt = stmt.where(
            func.lower(DoctorProfile.specialty) == func.lower(specialty)
        )

    if search:
        search_pattern = f"%{search.lower()}%"
        full_name = func.concat(
            func.coalesce(func.lower(User.first_name), ""),
            " ",
            func.coalesce(func.lower(User.last_name), "")
        )
        stmt = stmt.where(
            or_(
                func.lower(User.first_name).like(search_pattern),
                func.lower(User.last_name).like(search_pattern),
                full_name.like(search_pattern),
                func.lower(User.email).like(search_pattern),
                func.lower(func.coalesce(DoctorProfile.specialty, "")).like(search_pattern),
            )
        )

    result = await session.execute(stmt)

    doctors: List[Dict[str, Any]] = []
    for user, profile in result.all():
        doctors.append(
            {
                "id": user.id,
                "first_name": user.first_name,
                "middle_name": user.middle_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "specialty": profile.specialty if profile else None,
                "bio": profile.bio if profile else None,
                "photo_url": profile.photo_url if profile else None,
                "years_of_experience": profile.years_of_experience if profile else None,
                "languages_spoken": profile.languages_spoken if profile else [],
                "board_certifications": profile.board_certifications if profile else [],
            }
        )

    return doctors


async def list_distinct_specialties(session: AsyncSession) -> List[str]:
    """Return distinct doctor specialties present in the database."""
    stmt = (
        select(func.distinct(DoctorProfile.specialty))
        .where(DoctorProfile.specialty.is_not(None))
        .order_by(func.lower(DoctorProfile.specialty))
    )
    result = await session.execute(stmt)
    return [row[0] for row in result if row[0]]
