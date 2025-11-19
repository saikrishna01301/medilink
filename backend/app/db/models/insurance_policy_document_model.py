from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class InsurancePolicyDocument(Base):
    """Junction table linking insurance policies to patient files"""
    __tablename__ = "insurance_policy_documents"

    id: Mapped[UUID] = mapped_column(
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
    patient_file_id: Mapped[int] = mapped_column(
        ForeignKey("patient_files.file_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    policy: Mapped["PatientInsurancePolicy"] = relationship(back_populates="policy_documents")
    patient_file: Mapped["PatientFile"] = relationship()

