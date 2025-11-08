from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    UploadFile,
    File,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from db.crud import auth_crud, doctor_crud
from schemas import DoctorProfileUpdate, DoctorProfileRead, DoctorListItem
from services import verify_access_token, get_storage_service
from typing import Dict, Any, List, Optional
import uuid
import os

router = APIRouter()


# Dependency to get current doctor from access token
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


# Generic authenticated user dependency (patients/providers)
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


@router.get("/", response_model=List[DoctorListItem])
async def list_doctors(
    search: Optional[str] = Query(None, description="Search by name, email, or specialty"),
    specialty: Optional[str] = Query(None, description="Filter by specialty"),
    session: AsyncSession = Depends(get_session),
    _: Any = Depends(get_authenticated_user),
):
    """List all doctors with profile information."""
    doctors = await doctor_crud.list_doctors_with_profiles(
        session, search=search, specialty=specialty
    )
    return doctors


@router.get("/specialties", response_model=List[str])
async def list_specialties(
    session: AsyncSession = Depends(get_session),
    _: Any = Depends(get_authenticated_user),
):
    """Return distinct list of doctor specialties available."""
    specialties = await doctor_crud.list_distinct_specialties(session)
    return specialties




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


@router.post("/upload-profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload a profile picture for the doctor"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    try:
        # Get current profile to check for existing photo
        profile = await doctor_crud.get_doctor_profile(current_user.id, session)
        
        storage_service = get_storage_service()
        
        # Delete ALL old profile pictures for this doctor
        # This ensures we clean up any orphaned files from previous uploads
        doctor_profile_prefix = f"doctor-profiles/{current_user.id}/"
        deleted_count = await storage_service.delete_files_by_prefix(doctor_profile_prefix)
        
        if deleted_count > 0:
            print(f"Deleted {deleted_count} old profile picture(s) for doctor {current_user.id}")
        
        # Generate unique filename using UUID
        file_extension = os.path.splitext(file.filename)[1] or ".jpg"
        unique_filename = f"doctor-profiles/{current_user.id}/{uuid.uuid4()}{file_extension}"
        
        # Upload to GCP Storage
        public_url = await storage_service.upload_file(
            file_content,
            unique_filename,
            content_type=file.content_type
        )
        
        # Update or create doctor profile with new photo URL
        update_data = {"photo_url": public_url}
        updated_profile = await doctor_crud.update_doctor_profile(
            current_user.id, update_data, session
        )
        
        if not updated_profile:
            # Profile doesn't exist yet – create it with the photo URL and a default specialty
            create_data = {
                "photo_url": public_url,
                "specialty": "General Practice",
            }
            await doctor_crud.create_doctor_profile(
                create_data, current_user.id, session
            )
        
        return {
            "message": "Profile picture uploaded successfully",
            "photo_url": public_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )


@router.delete("/profile-picture")
async def delete_profile_picture(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete the doctor's profile picture"""
    try:
        # Get current profile
        profile = await doctor_crud.get_doctor_profile(current_user.id, session)
        
        if not profile or not profile.photo_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile picture found"
            )
        
        # Extract file path from URL and delete from storage
        photo_url = profile.photo_url
        storage_service = get_storage_service()
        file_path = storage_service.extract_file_path_from_url(photo_url)
        
        if file_path:
            # Delete from storage
            await storage_service.delete_file(file_path)
        
        # Clear photo_url in database
        update_data = {"photo_url": None}
        await doctor_crud.update_doctor_profile(
            current_user.id, update_data, session
        )
        
        return {"message": "Profile picture deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile picture: {str(e)}"
        )

