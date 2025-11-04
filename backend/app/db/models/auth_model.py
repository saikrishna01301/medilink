from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, func
from datetime import datetime
from db.base import Base


# user list of sessions
class DBSession(Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # the user_id is connected to particular users user_id column (mapped as id in User model)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)

    # Stores the HASHED refresh token
    refresh_token_hash: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

    # Relationship to the User model
    user: Mapped["User"] = relationship(back_populates="sessions")


class OTPStore(Base):
    __tablename__ = "otp_store"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # CRITICAL FIX: Link to the User table using ForeignKey (references users.user_id column)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"), nullable=False, index=True
    )
    # We still need the identifier for lookup/display, but the Foreign Key is the true link
    identifier: Mapped[str] = mapped_column(String, nullable=False)
    otp_code: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # Define the relationship back to the user
    user: Mapped["User"] = relationship(back_populates="otp_codes")
