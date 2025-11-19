from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from db.base import Base


class PatientInsurancePolicy(Base):
    __tablename__ = "patient_insurance_policies"

    id: Mapped[UUID] = mapped_column(
        "policy_id",
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    patient_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    insurer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    insurance_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    coverage_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    coverage_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    cover_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationship to user
    patient: Mapped["User"] = orm_relationship(back_populates="insurance_policies")

    # Relationship to policy documents
    policy_documents: Mapped[List["InsurancePolicyDocument"]] = orm_relationship(
        back_populates="policy",
        cascade="all, delete-orphan",
    )

    policy_members: Mapped[List["PatientInsurancePolicyMember"]] = orm_relationship(
        back_populates="policy",
        cascade="all, delete-orphan",
        order_by="PatientInsurancePolicyMember.created_at",
    )


class PatientInsurancePolicyMember(Base):
    __tablename__ = "patient_insurance_policy_members"

    id: Mapped[UUID] = mapped_column(
        "member_id",
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    policy_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("patient_insurance_policies.policy_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    relationship: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    policy: Mapped["PatientInsurancePolicy"] = orm_relationship(back_populates="policy_members")
