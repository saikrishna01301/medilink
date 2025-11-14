from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from db import DoctorProfile, DoctorSocialLink, User
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


async def ensure_doctor_profile(user_id: int, session: AsyncSession) -> DoctorProfile:
    """Ensure a doctor profile exists for the given user. Creates a minimal profile if missing."""
    profile = await get_doctor_profile(user_id, session)
    if profile:
        return profile

    profile = DoctorProfile(
        user_id=user_id,
        specialty="General Practice",
        accepting_new_patients=False,
        offers_virtual_visits=False,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


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
    social_links: List[Dict[str, Any]] = []

    if profile:
        links_result = await session.execute(
            select(DoctorSocialLink)
            .where(DoctorSocialLink.doctor_profile_id == profile.id)
            .order_by(DoctorSocialLink.display_order, DoctorSocialLink.id)
        )
        social_links = [
            {
                "id": link.id,
                "doctor_profile_id": link.doctor_profile_id,
                "platform": link.platform,
                "url": link.url,
                "display_label": link.display_label,
                "is_visible": link.is_visible,
                "display_order": link.display_order,
                "created_at": link.created_at,
                "updated_at": link.updated_at,
            }
            for link, in links_result.all()
        ]

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
            "cover_photo_url": profile.cover_photo_url,
            "accepting_new_patients": profile.accepting_new_patients,
            "offers_virtual_visits": profile.offers_virtual_visits,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        } if profile else None,
        "clinics": [],  # Empty list for compatibility
        "social_links": social_links,
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
                "accepting_new_patients": profile.accepting_new_patients if profile else False,
                "offers_virtual_visits": profile.offers_virtual_visits if profile else False,
                "cover_photo_url": profile.cover_photo_url if profile else None,
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


async def list_social_links(user_id: int, session: AsyncSession) -> List[DoctorSocialLink]:
    """List social links for a doctor's profile."""
    profile = await get_doctor_profile(user_id, session)
    if not profile:
        return []

    result = await session.execute(
        select(DoctorSocialLink)
        .where(DoctorSocialLink.doctor_profile_id == profile.id)
        .order_by(DoctorSocialLink.display_order, DoctorSocialLink.id)
    )
    return [link for (link,) in result.all()]


async def create_social_link(
    user_id: int,
    link_data: dict,
    session: AsyncSession,
) -> DoctorSocialLink:
    """Create a social link for the doctor's profile."""
    profile = await ensure_doctor_profile(user_id, session)

    link = DoctorSocialLink(doctor_profile_id=profile.id, **link_data)
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link


async def update_social_link(
    user_id: int,
    link_id: int,
    link_data: dict,
    session: AsyncSession,
) -> Optional[DoctorSocialLink]:
    """Update a social link if it belongs to the doctor's profile."""
    profile = await get_doctor_profile(user_id, session)
    if not profile:
        return None

    result = await session.execute(
        select(DoctorSocialLink)
        .where(
            DoctorSocialLink.id == link_id,
            DoctorSocialLink.doctor_profile_id == profile.id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        return None

    for key, value in link_data.items():
        setattr(link, key, value)

    link.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(link)
    return link


async def delete_social_link(
    user_id: int,
    link_id: int,
    session: AsyncSession,
) -> bool:
    """Delete a social link if it belongs to the doctor."""
    profile = await get_doctor_profile(user_id, session)
    if not profile:
        return False

    result = await session.execute(
        select(DoctorSocialLink)
        .where(
            DoctorSocialLink.id == link_id,
            DoctorSocialLink.doctor_profile_id == profile.id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        return False

    await session.delete(link)
    await session.commit()
    return True
