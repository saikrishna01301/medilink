from pydantic import BaseModel, Field, EmailStr
from enum import Enum
from typing import Optional


class UserRole(str, Enum):
    doctor = "doctor"
    patient = "patient"
    insurer = "insurer"


# Base user model
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, description="user firstname")
    last_name: str = Field(..., min_length=1, description="user lastname")
    email: EmailStr = Field(..., description="account email")
    phone: str = Field(..., min_length=10, description="User's phone number")
    role: UserRole = Field(..., description="Must be 'doctor', 'patient', or 'insurer'")
    accepted_terms: bool = Field(
        ..., description="Must be true to accept the Terms & Conditions."
    )

    class Config:
        use_enum_values = True
        from_attributes = True


# create new account model
class CreateUser(UserBase):
    password: str = Field(..., min_length=8, description="account password")


# read user model
class ReadUser(UserBase):
    id: int = Field(..., description="user's unique id")
