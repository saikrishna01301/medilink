from typing import List, Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, func, Text, ARRAY, DECIMAL, TIME, Date
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


class Clinic(Base):
    """
    Clinic/location information where doctors practice.
    """
    __tablename__ = "clinics"

    id: Mapped[int] = mapped_column("clinic_id", primary_key=True, index=True)
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(200), nullable=False)
    address_line2: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="USA")
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 8), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(DECIMAL(11, 8), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
    
    # Relationship to doctor-clinic assignments
    doctor_assignments: Mapped[List["DoctorClinicAssignment"]] = relationship(back_populates="clinic")


class DoctorClinicAssignment(Base):
    """
    Many-to-many relationship between doctors and clinics.
    One doctor can work at multiple clinics.
    """
    __tablename__ = "doctor_clinic_assignments"

    id: Mapped[int] = mapped_column("assignment_id", primary_key=True, index=True)
    
    # Foreign Key: Doctor (references users.user_id)
    doctor_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),  # ← References users.user_id
        nullable=False,
        index=True
    )
    
    # Foreign Key: Clinic
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.clinic_id"),
        nullable=False,
        index=True
    )
    
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    consultation_fee: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    available_from: Mapped[Optional[datetime.time]] = mapped_column(TIME, nullable=True)
    available_to: Mapped[Optional[datetime.time]] = mapped_column(TIME, nullable=True)
    days_of_week: Mapped[Optional[List[int]]] = mapped_column(ARRAY(Integer), nullable=True)
    accepting_new_patients: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    doctor: Mapped["User"] = relationship(back_populates="clinic_assignments")
    clinic: Mapped["Clinic"] = relationship(back_populates="doctor_assignments")


class PatientDoctorRelationship(Base):
    """
    Tracks relationships between patients and doctors (My Care Team).
    Links patients to doctors they've seen or saved.
    """
    __tablename__ = "patient_doctor_relationships"

    id: Mapped[int] = mapped_column("relationship_id", primary_key=True, index=True)
    
    # Foreign Key: Patient (references users.user_id)
    patient_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),  # ← References users.user_id
        nullable=False,
        index=True
    )
    
    # Foreign Key: Doctor (references users.user_id)
    doctor_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),  # ← References users.user_id
        nullable=False,
        index=True
    )
    
    # Foreign Key: Clinic (optional)
    clinic_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("clinics.clinic_id"),
        nullable=True,
        index=True
    )
    
    relationship_type: Mapped[str] = mapped_column(String(50), default="care_team")
    last_visit_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
    
    # Relationships - using foreign_keys to specify which FK to use
    patient: Mapped["User"] = relationship(
        "User",
        foreign_keys=[patient_user_id],
        back_populates="patient_doctor_relationships"
    )
    
    doctor: Mapped["User"] = relationship(
        "User",
        foreign_keys=[doctor_user_id],
        back_populates="doctor_relationships"
    )
    
    clinic: Mapped[Optional["Clinic"]] = relationship()

