from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db import DoctorProfile, User
from typing import Optional, Dict, Any
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
    
    # Update fields
    for key, value in profile_data.items():
        if value is not None:  # Only update provided fields
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

