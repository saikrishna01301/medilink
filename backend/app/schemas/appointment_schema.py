from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    start_time: datetime
    end_time: datetime
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=255)
    is_all_day: bool = False
    patient_user_id: Optional[int] = None
    doctor_user_id: Optional[int] = None
    clinic_id: Optional[int] = None
    status: Optional[str] = Field(default=None, max_length=50)


class AppointmentRead(BaseModel):
    id: int
    patient_user_id: Optional[int] = None
    doctor_user_id: Optional[int] = None
    clinic_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    status: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    is_all_day: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

