from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, func
from datetime import datetime
from app.db.base import Base


# user table
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    # Unique constraints required for login/signup validation
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # Security field (stores the HASHED password)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    accepted_terms: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Link to dbsessions
    sessions: Mapped[List["DBSession"]] = relationship(back_populates="user")
    # Link to the OTPStore
    otp_codes: Mapped[List["OTPStore"]] = relationship(back_populates="user")
