from __future__ import annotations

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import DateTime, Integer, String, Text, ForeignKey, func, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class NotificationType(str, enum.Enum):
    appointment_request = "appointment_request"
    appointment_accepted = "appointment_accepted"
    appointment_rejected = "appointment_rejected"
    appointment_suggested = "appointment_suggested"
    appointment_confirmed = "appointment_confirmed"
    appointment_cancelled = "appointment_cancelled"
    general = "general"


class NotificationStatus(str, enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"


class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        SQLEnum(NotificationType, name="notification_type", create_constraint=False),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SQLEnum(NotificationStatus, name="notification_status", create_constraint=False),
        nullable=False,
        default=NotificationStatus.unread.value
    )
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    appointment_request_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("appointment_requests.request_id"),
        nullable=True
    )
    appointment_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("appointments.appointment_id"),
        nullable=True
    )
    notification_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

