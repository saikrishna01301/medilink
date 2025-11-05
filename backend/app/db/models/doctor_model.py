from typing import List, Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, func, Text, ARRAY
from datetime import datetime
from db.base import Base


class DoctorProfile(Base):
    """
    Doctor profile information linked to users table.
    One-to-one relationship: One user can have one doctor profile.
    """
    __tablename__ = "doctor_profiles"

    id: Mapped[int] = mapped_column("profile_id", primary_key=True, index=True)
    
    # Foreign Key: References users.user_id (the database column name)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),  # ← This references the DATABASE column "user_id"
        unique=True,  # One profile per doctor
        nullable=False,
        index=True
    )
    
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    years_of_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    medical_license_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    board_certifications: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    languages_spoken: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
    
    # Relationship back to User model
    # This allows: doctor_profile.user.first_name, doctor_profile.user.email, etc.
    user: Mapped["User"] = relationship(back_populates="doctor_profile")

