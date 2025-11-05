from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DoctorProfileBase(BaseModel):
    specialty: str = Field(..., min_length=1, max_length=100, description="Doctor's specialty")
    bio: Optional[str] = Field(None, description="Doctor's biography")
    photo_url: Optional[str] = Field(None, max_length=500, description="URL to doctor's photo")
    years_of_experience: Optional[int] = Field(None, ge=0, description="Years of experience")
    medical_license_number: Optional[str] = Field(None, max_length=50, description="Medical license number")
    board_certifications: Optional[List[str]] = Field(None, description="List of board certifications")
    languages_spoken: Optional[List[str]] = Field(None, description="List of languages spoken")

    class Config:
        from_attributes = True


class DoctorProfileCreate(DoctorProfileBase):
    pass


class DoctorProfileUpdate(BaseModel):
    specialty: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    years_of_experience: Optional[int] = Field(None, ge=0)
    medical_license_number: Optional[str] = Field(None, max_length=50)
    board_certifications: Optional[List[str]] = None
    languages_spoken: Optional[List[str]] = None

    class Config:
        from_attributes = True


class DoctorProfileRead(DoctorProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class DoctorProfileWithUser(BaseModel):
    """Complete doctor profile with user information"""
    profile: Optional[DoctorProfileRead] = None
    user: dict  # User basic info
    clinics: List[dict] = Field(default_factory=list)  # Empty list for compatibility

    class Config:
        from_attributes = True

