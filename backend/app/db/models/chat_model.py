"""
SQLAlchemy models for chat system.
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from db.base import Base


class Conversation(Base):
    """Chat conversation model (one-to-one or group)."""
    __tablename__ = "conversations"
    
    conversation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_type = Column(String(20), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            "conversation_type IN ('direct', 'appointment', 'support')",
            name="check_conversation_type"
        ),
    )


class ConversationParticipant(Base):
    """Conversation participants model."""
    __tablename__ = "conversation_participants"
    
    participant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", backref="chat_participations")


class Message(Base):
    """Chat message model."""
    __tablename__ = "messages"
    
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), nullable=False, default="text")
    attachment_url = Column(String(500), nullable=True)
    is_edited = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", backref="sent_messages")
    read_receipts = relationship("MessageReadReceipt", back_populates="message", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            "message_type IN ('text', 'image', 'file', 'system')",
            name="check_message_type"
        ),
    )


class MessageReadReceipt(Base):
    """Message read receipts model."""
    __tablename__ = "message_read_receipts"
    
    receipt_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.message_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    message = relationship("Message", back_populates="read_receipts")
    user = relationship("User", backref="read_receipts")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

