from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Literal
from datetime import datetime


class PatientFileRead(BaseModel):
    """Schema for reading a patient file"""
    id: int = Field(..., description="File ID")
    file_name: str = Field(..., description="Original file name")
    file_url: str = Field(..., description="URL to access the file")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="Size of the file in bytes")
    created_at: str = Field(..., description="ISO format timestamp of when file was created")

    class Config:
        from_attributes = True


class FileBatchCreate(BaseModel):
    """Schema for creating a file batch (used internally)"""
    category: str = Field(..., description="Category: 'insurance' or 'lab_report'")
    heading: Optional[str] = Field(None, description="Optional heading for the batch")


class FileBatchRead(BaseModel):
    """Schema for reading a file batch"""
    id: int = Field(..., description="File batch ID")
    patient_user_id: int = Field(..., description="ID of the patient who owns this batch")
    category: str = Field(..., description="Category: 'insurance' or 'lab_report'")
    heading: Optional[str] = Field(None, description="Optional heading for the batch")
    created_at: str = Field(..., description="ISO format timestamp of when batch was created")
    updated_at: str = Field(..., description="ISO format timestamp of when batch was last updated")

    class Config:
        from_attributes = True


class FileBatchWithFiles(BaseModel):
    """Schema for reading a file batch with its files"""
    id: int = Field(..., description="File batch ID")
    patient_user_id: int = Field(..., description="ID of the patient who owns this batch")
    category: str = Field(..., description="Category: 'insurance' or 'lab_report'")
    heading: Optional[str] = Field(None, description="Optional heading for the batch")
    created_at: str = Field(..., description="ISO format timestamp of when batch was created")
    updated_at: str = Field(..., description="ISO format timestamp of when batch was last updated")
    files: List[PatientFileRead] = Field(default_factory=list, description="List of files in the batch")

    class Config:
        from_attributes = True


class ShareableDoctor(BaseModel):
    doctor_user_id: int = Field(..., description="Doctor user ID")
    doctor_name: str = Field(..., description="Full name of the doctor")
    doctor_photo_url: Optional[str] = Field(None, description="Doctor profile photo URL")
    doctor_specialty: Optional[str] = Field(None, description="Primary specialty to display")
    relationship_type: Literal["appointment", "appointment_request"] = Field(..., description="Source of the relationship")
    appointment_id: Optional[int] = Field(None, description="Linked appointment ID if available")
    appointment_status: Optional[str] = Field(None, description="Appointment status")
    appointment_date: Optional[str] = Field(None, description="Appointment date/time in ISO format")
    appointment_request_id: Optional[int] = Field(None, description="Linked appointment request ID if applicable")
    appointment_request_status: Optional[str] = Field(None, description="Appointment request status if applicable")
    appointment_request_preferred_date: Optional[str] = Field(None, description="Preferred date from appointment request")


class FileBatchShareTarget(BaseModel):
    doctor_user_id: int = Field(..., description="Doctor user ID to share with")
    appointment_id: Optional[int] = Field(None, description="Confirmed appointment reference")
    appointment_request_id: Optional[int] = Field(None, description="Pending appointment request reference")

    @model_validator(mode="after")
    def validate_reference(self) -> "FileBatchShareTarget":
        if not self.appointment_id and not self.appointment_request_id:
            raise ValueError("Either appointment_id or appointment_request_id must be provided")
        return self


class ShareBatchRequest(BaseModel):
    doctor_targets: List[FileBatchShareTarget] = Field(..., min_length=1, description="Doctors selected for sharing")


class FileBatchShareRead(BaseModel):
    share_id: int = Field(..., description="Share identifier")
    file_batch_id: int = Field(..., description="Batch that was shared")
    batch_heading: Optional[str] = Field(None, description="Heading/title of the shared batch")
    batch_category: str = Field(..., description="Category of the shared batch")
    share_status: str = Field(..., description="Current status of the share record")
    shared_at: str = Field(..., description="Timestamp of the latest share action")
    patient_user_id: int = Field(..., description="Patient who owns the files")
    patient_name: str = Field(..., description="Display name of the patient")
    doctor_user_id: int = Field(..., description="Doctor who received the share")
    doctor_name: Optional[str] = Field(None, description="Doctor display name")
    doctor_photo_url: Optional[str] = Field(None, description="Doctor profile photo")
    doctor_specialty: Optional[str] = Field(None, description="Doctor specialty label")
    appointment_id: Optional[int] = Field(None, description="Appointment reference if applicable")
    appointment_status: Optional[str] = Field(None, description="Status of the appointment")
    appointment_date: Optional[str] = Field(None, description="Date/time of the appointment")
    appointment_request_id: Optional[int] = Field(None, description="Appointment request reference if applicable")
    appointment_request_status: Optional[str] = Field(None, description="Status of the appointment request")
    appointment_request_preferred_date: Optional[str] = Field(None, description="Preferred date recorded in the request")
    files: List[PatientFileRead] = Field(default_factory=list, description="Files included in the shared batch")

    class Config:
        from_attributes = True

