from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MedicalSpecialty(str, Enum):
    """Medical specialty enum for API validation"""
    allergist = "Allergist"
    immunologist = "Immunologist"
    anesthesiologist = "Anesthesiologist"
    cardiologist = "Cardiologist"
    colon_and_rectal_surgeon = "Colon and Rectal Surgeon"
    dermatologist = "Dermatologist"
    radiologist = "Radiologist"
    emergency_medicine_physician = "Emergency Medicine Physician"
    endocrinologist = "Endocrinologist"
    family_medicine_physician = "Family Medicine Physician"
    gastroenterologist = "Gastroenterologist"
    general_surgeon = "General Surgeon"
    geriatrician = "Geriatrician"
    hematologist = "Hematologist"
    infectious_disease_specialist = "Infectious Disease Specialist"
    internist = "Internist"
    medical_geneticist = "Medical Geneticist"
    nephrologist = "Nephrologist"
    neurosurgeon = "Neurosurgeon"
    neurologist = "Neurologist"
    nuclear_medicine_specialist = "Nuclear Medicine Specialist"
    obstetrician_gynecologist = "Obstetrician-Gynecologist"
    oncologist = "Oncologist"
    ophthalmologist = "Ophthalmologist"
    orthopedic_surgeon = "Orthopedic Surgeon"
    otolaryngologist = "Otolaryngologist"
    ent_specialist = "ENT Specialist"
    pathologist = "Pathologist"
    pediatrician = "Pediatrician"
    physiatrist = "Physiatrist"
    plastic_surgeon = "Plastic Surgeon"
    preventive_medicine_specialist = "Preventive Medicine Specialist"
    psychiatrist = "Psychiatrist"
    pulmonologist = "Pulmonologist"
    radiation_oncologist = "Radiation Oncologist"
    rheumatologist = "Rheumatologist"
    sleep_medicine_specialist = "Sleep Medicine Specialist"
    sports_medicine_specialist = "Sports Medicine Specialist"
    urologist = "Urologist"
    vascular_surgeon = "Vascular Surgeon"


class DoctorProfileBase(BaseModel):
    specialty: MedicalSpecialty = Field(..., description="Doctor's specialty")
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
    specialty: Optional[MedicalSpecialty] = Field(None, description="Doctor's specialty")
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

