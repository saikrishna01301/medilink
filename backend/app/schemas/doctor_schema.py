from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DoctorProfileBase(BaseModel):
    specialty: str = Field(..., description="Doctor's specialty")
    bio: Optional[str] = Field(None, description="Doctor's biography")
    photo_url: Optional[str] = Field(None, max_length=500, description="URL to doctor's photo")
    years_of_experience: Optional[int] = Field(None, ge=0, description="Years of experience")
    medical_license_number: Optional[str] = Field(None, max_length=50, description="Medical license number")
    board_certifications: Optional[List[str]] = Field(None, description="List of board certifications")
    languages_spoken: Optional[List[str]] = Field(None, description="List of languages spoken")
    cover_photo_url: Optional[str] = Field(None, max_length=500, description="URL to doctor's cover photo")
    accepting_new_patients: bool = Field(default=False, description="Whether doctor is accepting new patients")
    offers_virtual_visits: bool = Field(default=False, description="Whether doctor offers virtual visits")

    class Config:
        from_attributes = True


class DoctorProfileCreate(DoctorProfileBase):
    pass


class DoctorProfileUpdate(BaseModel):
    specialty: Optional[str] = Field(None, description="Doctor's specialty")
    bio: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    years_of_experience: Optional[int] = Field(None, ge=0)
    medical_license_number: Optional[str] = Field(None, max_length=50)
    board_certifications: Optional[List[str]] = None
    languages_spoken: Optional[List[str]] = None
    cover_photo_url: Optional[str] = Field(None, max_length=500)
    accepting_new_patients: Optional[bool] = None
    offers_virtual_visits: Optional[bool] = None

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
    social_links: List["DoctorSocialLinkRead"] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DoctorSocialLinkBase(BaseModel):
    platform: str = Field(..., max_length=50, description="Social media platform identifier")
    url: str = Field(..., max_length=500, description="URL to the profile/page")
    display_label: Optional[str] = Field(None, max_length=100, description="Optional label to display")
    is_visible: bool = Field(default=True, description="Whether to show on public profile")
    display_order: Optional[int] = Field(None, ge=0, le=32767, description="Optional display order")

    class Config:
        from_attributes = True


class DoctorSocialLinkCreate(DoctorSocialLinkBase):
    pass


class DoctorSocialLinkUpdate(BaseModel):
    platform: Optional[str] = Field(None, max_length=50)
    url: Optional[str] = Field(None, max_length=500)
    display_label: Optional[str] = Field(None, max_length=100)
    is_visible: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0, le=32767)

    class Config:
        from_attributes = True


class DoctorSocialLinkRead(DoctorSocialLinkBase):
    id: int
    doctor_profile_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


DoctorProfileWithUser.model_rebuild()


class DoctorListItem(BaseModel):
    """Simplified doctor data for patient discovery."""
    id: int
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    years_of_experience: Optional[int] = None
    languages_spoken: List[str] = Field(default_factory=list)
    board_certifications: List[str] = Field(default_factory=list)
    accepting_new_patients: bool = Field(default=False)
    offers_virtual_visits: bool = Field(default=False)
    cover_photo_url: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    google_rating: Optional[float] = None
    google_user_ratings_total: Optional[int] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True
