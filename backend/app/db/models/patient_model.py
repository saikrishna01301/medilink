from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column("profile_id", primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    date_of_birth: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    blood_type: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    current_height_cm: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    current_weight_kg: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    last_height_recorded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_weight_recorded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="patient_profile")
    measurements: Mapped[List["PatientMeasurement"]] = relationship(
        back_populates="patient_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    medical_conditions: Mapped[List["PatientMedicalCondition"]] = relationship(
        back_populates="patient_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PatientMedicalCondition.created_at",
    )
    diagnoses: Mapped[List["PatientDiagnosis"]] = relationship(
        back_populates="patient_profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PatientDiagnosis.created_at",
    )


class MeasurementTypeEnum(str, enum.Enum):
    height = "height"
    weight = "weight"


class PatientMeasurement(Base):
    __tablename__ = "patient_measurements"

    id: Mapped[int] = mapped_column("measurement_id", primary_key=True, index=True)
    patient_profile_id: Mapped[int] = mapped_column(
        ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    measurement_type: Mapped[MeasurementTypeEnum] = mapped_column(
        SQLEnum(MeasurementTypeEnum, name="patient_measurement_type"),
        nullable=False,
    )
    value: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), nullable=False, default="metric")
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    patient_profile: Mapped[PatientProfile] = relationship(back_populates="measurements")


class ConditionStatusEnum(str, enum.Enum):
    active = "active"
    managed = "managed"
    resolved = "resolved"


class PatientMedicalCondition(Base):
    __tablename__ = "patient_medical_conditions"

    id: Mapped[int] = mapped_column("condition_id", primary_key=True, index=True)
    patient_profile_id: Mapped[int] = mapped_column(
        ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    condition_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ConditionStatusEnum] = mapped_column(
        SQLEnum(ConditionStatusEnum, name="patient_condition_status"),
        nullable=False,
        default=ConditionStatusEnum.active,
    )
    diagnosed_on: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_chronic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    patient_profile: Mapped[PatientProfile] = relationship(back_populates="medical_conditions")


class DiagnosisStatusEnum(str, enum.Enum):
    active = "active"
    in_remission = "in_remission"
    resolved = "resolved"


class PatientDiagnosis(Base):
    __tablename__ = "patient_diagnoses"

    id: Mapped[int] = mapped_column("diagnosis_id", primary_key=True, index=True)
    patient_profile_id: Mapped[int] = mapped_column(
        ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    disease_name: Mapped[str] = mapped_column(String(200), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    status: Mapped[DiagnosisStatusEnum] = mapped_column(
        SQLEnum(DiagnosisStatusEnum, name="patient_diagnosis_status"),
        nullable=False,
        default=DiagnosisStatusEnum.active,
    )
    diagnosed_on: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    patient_profile: Mapped[PatientProfile] = relationship(back_populates="diagnoses")

