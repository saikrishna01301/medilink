from __future__ import annotations

from datetime import datetime, time
from typing import Optional
from pydantic import BaseModel, Field


class AppointmentRequestCreate(BaseModel):
    doctor_user_id: int
    clinic_id: Optional[int] = None
    preferred_date: datetime
    preferred_time_slot_start: time
    is_flexible: bool = Field(default=False)
    reason: Optional[str] = Field(default=None, max_length=1000)
    notes: Optional[str] = Field(default=None, max_length=2000)


class AppointmentRequestUpdate(BaseModel):
    status: Optional[str] = None
    suggested_date: Optional[datetime] = None
    suggested_time_slot_start: Optional[time] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class AppointmentRequestRead(BaseModel):
    request_id: int
    patient_user_id: int
    doctor_user_id: int
    clinic_id: Optional[int]
    preferred_date: datetime
    preferred_time_slot_start: time
    is_flexible: bool
    status: str
    reason: Optional[str]
    notes: Optional[str]
    suggested_date: Optional[datetime]
    suggested_time_slot_start: Optional[time]
    appointment_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentRequestResponse(BaseModel):
    request_id: int
    patient_user_id: int
    doctor_user_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    clinic_id: Optional[int]
    preferred_date: datetime
    preferred_time_slot_start: time
    is_flexible: bool
    status: str
    reason: Optional[str]
    notes: Optional[str]
    suggested_date: Optional[datetime]
    suggested_time_slot_start: Optional[time]
    appointment_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

