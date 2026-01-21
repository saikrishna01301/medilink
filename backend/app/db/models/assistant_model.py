from db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey
from datetime import datetime


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    citations: Mapped[str] = mapped_column(String, nullable=True)
    user: Mapped["User"] = relationship(back_populates="chat_history")
