from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING, Dict, Any

from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Float,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from .user_model import User


class Address(Base):
    """
    ORM mapping for the `addresses` table.

    This stores primary and secondary addresses for any user (doctor, patient, etc.).
    For now we use it to persist the primary address edited from the account settings pages.
    """

    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column("address_id", Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)

    formatted_address: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )

    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    place_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    raw_geocoding_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="addresses")


