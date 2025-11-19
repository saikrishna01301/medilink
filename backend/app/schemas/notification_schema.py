from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    appointment_request_id: Optional[int] = None
    appointment_id: Optional[int] = None
    notification_metadata: Optional[Dict[str, Any]] = None


class NotificationUpdate(BaseModel):
    status: Optional[str] = None
    read_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None


class NotificationRead(BaseModel):
    notification_id: int
    user_id: int
    type: str
    title: str
    message: str
    status: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[int]
    appointment_request_id: Optional[int]
    appointment_id: Optional[int]
    notification_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    read_at: Optional[datetime]
    archived_at: Optional[datetime]

    class Config:
        from_attributes = True

