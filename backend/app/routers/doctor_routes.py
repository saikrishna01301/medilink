from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from db.crud import auth_crud, doctor_crud
from schemas import DoctorProfileUpdate, DoctorProfileRead
from services import verify_access_token
from typing import Dict, Any

router = APIRouter()


# Dependency to get current user from access token
async def get_current_user(
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
    
    # Verify user is a doctor
    if user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to doctors"
        )

    return user


@router.get("/profile", response_model=Dict[str, Any])
async def get_doctor_profile(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get doctor profile with user info"""
    profile_data = await doctor_crud.get_doctor_profile_with_clinics(
        current_user.id, session
    )
    
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    return profile_data


@router.put("/profile", response_model=Dict[str, Any])
async def update_doctor_profile(
    profile_update: DoctorProfileUpdate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update doctor profile"""
    # Convert Pydantic model to dict, excluding None values
    update_data = profile_update.model_dump(exclude_unset=True, exclude_none=False)
    
    # Remove None values manually to allow clearing fields
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    updated_profile = await doctor_crud.update_doctor_profile(
        current_user.id, update_data, session
    )
    
    if not updated_profile:
        # Profile doesn't exist, create it
        create_data = profile_update.model_dump(exclude_unset=True)
        updated_profile = await doctor_crud.create_doctor_profile(
            create_data, current_user.id, session
        )
    
    # Return updated profile with user info
    profile_data = await doctor_crud.get_doctor_profile_with_clinics(
        current_user.id, session
    )
    
    return profile_data


@router.put("/user-info")
async def update_user_info(
    user_data: Dict[str, Any],
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update doctor's basic user information"""
    # Only allow updating specific fields
    allowed_fields = ["first_name", "middle_name", "last_name", "phone", "emergency_contact"]
    update_data = {k: v for k, v in user_data.items() if k in allowed_fields and v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    updated_user = await doctor_crud.update_user_info(
        current_user.id, update_data, session
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return updated profile with user info
    profile_data = await doctor_crud.get_doctor_profile_with_clinics(
        current_user.id, session
    )
    
    return profile_data

