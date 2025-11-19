from __future__ import annotations

from datetime import datetime, time
from typing import Optional
import enum

from sqlalchemy import DateTime, Integer, String, Text, Boolean, Time, ForeignKey, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class AppointmentRequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    doctor_suggested_alternative = "doctor_suggested_alternative"
    patient_accepted_alternative = "patient_accepted_alternative"
    patient_rejected_alternative = "patient_rejected_alternative"
    confirmed = "confirmed"


class AppointmentRequest(Base):
    __tablename__ = "appointment_requests"

    request_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    doctor_user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    clinic_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    preferred_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    preferred_time_slot_start: Mapped[time] = mapped_column(Time, nullable=False)
    is_flexible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        SQLEnum(AppointmentRequestStatus, name="appointment_request_status", create_constraint=False),
        nullable=False,
        default=AppointmentRequestStatus.pending.value
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suggested_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    suggested_time_slot_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    appointment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("appointments.appointment_id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

