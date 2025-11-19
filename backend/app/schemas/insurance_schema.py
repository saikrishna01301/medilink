from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from uuid import UUID


class InsuranceMember(BaseModel):
    name: str
    relationship: Optional[str] = None  # e.g., "self", "spouse", "child"
    date_of_birth: Optional[date] = None


class PolicyFile(BaseModel):
    id: int
    file_name: str
    file_url: str
    file_type: str
    file_size: int
    created_at: Optional[str] = None


class InsurancePolicyBase(BaseModel):
    insurer_name: str = Field(..., min_length=1, max_length=200)
    plan_name: Optional[str] = Field(None, max_length=200)
    policy_number: str = Field(..., min_length=1, max_length=100)
    group_number: Optional[str] = Field(None, max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)
    coverage_start: Optional[date] = None
    coverage_end: Optional[date] = None
    is_primary: bool = Field(default=True)
    cover_amount: Optional[float] = Field(None, ge=0)
    policy_members: Optional[List[InsuranceMember]] = None


class InsurancePolicyCreate(InsurancePolicyBase):
    pass


class InsurancePolicyUpdate(BaseModel):
    insurer_name: Optional[str] = Field(None, min_length=1, max_length=200)
    plan_name: Optional[str] = Field(None, max_length=200)
    policy_number: Optional[str] = Field(None, min_length=1, max_length=100)
    group_number: Optional[str] = Field(None, max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)
    coverage_start: Optional[date] = None
    coverage_end: Optional[date] = None
    is_primary: Optional[bool] = None
    cover_amount: Optional[float] = Field(None, ge=0)
    policy_members: Optional[List[InsuranceMember]] = None


class InsurancePolicyRead(InsurancePolicyBase):
    id: UUID
    patient_user_id: int
    policy_files: Optional[List[PolicyFile]] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class InsurancePolicySummary(BaseModel):
    total_active: int
    total_expired: int
    policies: List[InsurancePolicyRead]

    class Config:
        from_attributes = True

