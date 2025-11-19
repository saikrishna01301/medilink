from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class PatientMeasurementRead(BaseModel):
    id: int
    measurement_type: Literal["height", "weight"]
    value: Optional[float]
    unit: str
    source: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class PatientMedicalConditionBase(BaseModel):
    condition_name: str = Field(..., max_length=200)
    status: Literal["active", "managed", "resolved"] = "active"
    diagnosed_on: Optional[date] = None
    notes: Optional[str] = None
    is_chronic: bool = True


class PatientMedicalConditionRead(PatientMedicalConditionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientDiagnosisBase(BaseModel):
    disease_name: str = Field(..., max_length=200)
    status: Literal["active", "in_remission", "resolved"] = "active"
    diagnosed_on: Optional[date] = None
    notes: Optional[str] = None
    icd10_code: Optional[str] = Field(None, max_length=10)


class PatientDiagnosisRead(PatientDiagnosisBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientProfileRead(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[date] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    photo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    current_height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    last_height_recorded_at: Optional[datetime] = None
    last_weight_recorded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientProfileUpdate(BaseModel):
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=50)
    blood_type: Optional[str] = Field(None, max_length=3)
    height_cm: Optional[float] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    medical_conditions: Optional[List[PatientMedicalConditionBase]] = None
    diagnosed_diseases: Optional[List[PatientDiagnosisBase]] = None


class PatientUserInfoUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientMeasurementHistory(BaseModel):
    height_history: List[PatientMeasurementRead] = Field(default_factory=list)
    weight_history: List[PatientMeasurementRead] = Field(default_factory=list)


class PatientUserSummary(BaseModel):
    id: int
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientProfileEnvelope(BaseModel):
    user: PatientUserSummary
    profile: Optional[PatientProfileRead] = None
    medical_conditions: List[PatientMedicalConditionRead] = Field(default_factory=list)
    diagnosed_diseases: List[PatientDiagnosisRead] = Field(default_factory=list)
    measurements: PatientMeasurementHistory = Field(default_factory=PatientMeasurementHistory)


class PatientProfileUpdateResponse(PatientProfileEnvelope):
    pass

