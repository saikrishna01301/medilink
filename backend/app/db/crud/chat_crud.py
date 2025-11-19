"""
CRUD operations for chat system.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime
from db.models.chat_model import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageReadReceipt,
)
from db.models.user_model import User


# Conversation CRUD
async def create_conversation(
    conversation_type: str,
    participant_user_ids: List[int],
    appointment_id: Optional[int] = None,
    session: AsyncSession = None,
) -> Conversation:
    """Create a new conversation with participants."""
    conversation = Conversation(
        conversation_type=conversation_type,
        appointment_id=appointment_id,
    )
    session.add(conversation)
    await session.flush()
    
    # Add participants
    participants = []
    for user_id in participant_user_ids:
        participant = ConversationParticipant(
            conversation_id=conversation.conversation_id,
            user_id=user_id,
        )
        participants.append(participant)
        session.add(participant)
    
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def get_conversation_by_id(
    conversation_id: UUID,
    session: AsyncSession = None,
) -> Optional[Conversation]:
    """Get conversation by ID with participants."""
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.participants))
        .where(Conversation.conversation_id == conversation_id)
    )
    return result.scalar_one_or_none()


async def get_user_conversations(
    user_id: int,
    session: AsyncSession = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Conversation]:
    """Get all conversations for a user."""
    result = await session.execute(
        select(Conversation)
        .join(ConversationParticipant)
        .options(selectinload(Conversation.participants))
        .where(
            and_(
                ConversationParticipant.user_id == user_id,
                ConversationParticipant.is_active == True,
            )
        )
        .order_by(desc(Conversation.updated_at))
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_or_create_direct_conversation(
    user1_id: int,
    user2_id: int,
    session: AsyncSession = None,
) -> Conversation:
    """Get existing direct conversation between two users or create a new one."""
    # Check if conversation already exists
    result = await session.execute(
        select(Conversation)
        .join(ConversationParticipant, Conversation.conversation_id == ConversationParticipant.conversation_id)
        .where(
            and_(
                Conversation.conversation_type == "direct",
                ConversationParticipant.user_id.in_([user1_id, user2_id]),
            )
        )
        .group_by(Conversation.conversation_id)
        .having(func.count(ConversationParticipant.user_id) == 2)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    # Create new conversation
    return await create_conversation(
        conversation_type="direct",
        participant_user_ids=[user1_id, user2_id],
        session=session,
    )


async def add_participant_to_conversation(
    conversation_id: UUID,
    user_id: int,
    session: AsyncSession = None,
) -> ConversationParticipant:
    """Add a participant to a conversation."""
    # Check if already a participant
    result = await session.execute(
        select(ConversationParticipant)
        .where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.is_active = True
        await session.commit()
        return existing
    
    participant = ConversationParticipant(
        conversation_id=conversation_id,
        user_id=user_id,
    )
    session.add(participant)
    await session.commit()
    await session.refresh(participant)
    return participant


async def update_participant_last_read(
    conversation_id: UUID,
    user_id: int,
    session: AsyncSession = None,
):
    """Update participant's last read timestamp."""
    result = await session.execute(
        select(ConversationParticipant)
        .where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
    )
    participant = result.scalar_one_or_none()
    if participant:
        participant.last_read_at = datetime.utcnow()
        await session.commit()


# Message CRUD
async def create_message(
    conversation_id: UUID,
    sender_id: int,
    content: str,
    message_type: str = "text",
    attachment_url: Optional[str] = None,
    session: AsyncSession = None,
) -> Message:
    """Create a new message."""
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
        attachment_url=attachment_url,
    )
    session.add(message)
    
    # Update conversation's updated_at timestamp
    conversation = await get_conversation_by_id(conversation_id, session)
    if conversation:
        conversation.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(message)
    return message


async def get_message_by_id(
    message_id: UUID,
    session: AsyncSession = None,
) -> Optional[Message]:
    """Get message by ID."""
    result = await session.execute(
        select(Message)
        .where(Message.message_id == message_id)
    )
    return result.scalar_one_or_none()


async def get_conversation_messages(
    conversation_id: UUID,
    session: AsyncSession = None,
    limit: int = 50,
    offset: int = 0,
    before_message_id: Optional[UUID] = None,
) -> List[Message]:
    """Get messages for a conversation with pagination."""
    query = select(Message).where(
        and_(
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
        )
    )
    
    if before_message_id:
        # Get messages before a specific message (for infinite scroll)
        before_message = await get_message_by_id(before_message_id, session)
        if before_message:
            query = query.where(Message.created_at < before_message.created_at)
    
    result = await session.execute(
        query
        .order_by(desc(Message.created_at))
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def update_message(
    message_id: UUID,
    content: str,
    session: AsyncSession = None,
) -> Optional[Message]:
    """Update message content."""
    message = await get_message_by_id(message_id, session)
    if message:
        message.content = content
        message.is_edited = True
        await session.commit()
        await session.refresh(message)
    return message


async def delete_message(
    message_id: UUID,
    session: AsyncSession = None,
) -> bool:
    """Soft delete a message."""
    message = await get_message_by_id(message_id, session)
    if message:
        message.is_deleted = True
        await session.commit()
        return True
    return False


async def get_unread_message_count(
    conversation_id: UUID,
    user_id: int,
    session: AsyncSession = None,
) -> int:
    """Get count of unread messages for a user in a conversation."""
    # Get participant's last read timestamp
    result = await session.execute(
        select(ConversationParticipant)
        .where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant or not participant.last_read_at:
        # If never read, count all messages
        result = await session.execute(
            select(func.count(Message.message_id))
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_deleted == False,
                )
            )
        )
        return result.scalar() or 0
    
    # Count messages after last read
    result = await session.execute(
        select(func.count(Message.message_id))
        .where(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.created_at > participant.last_read_at,
                Message.is_deleted == False,
            )
        )
    )
    return result.scalar() or 0


# Read Receipt CRUD
async def create_read_receipt(
    message_id: UUID,
    user_id: int,
    session: AsyncSession = None,
) -> MessageReadReceipt:
    """Create a read receipt for a message."""
    # Check if receipt already exists
    result = await session.execute(
        select(MessageReadReceipt)
        .where(
            and_(
                MessageReadReceipt.message_id == message_id,
                MessageReadReceipt.user_id == user_id,
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    receipt = MessageReadReceipt(
        message_id=message_id,
        user_id=user_id,
    )
    session.add(receipt)
    await session.commit()
    await session.refresh(receipt)
    return receipt


async def mark_conversation_as_read(
    conversation_id: UUID,
    user_id: int,
    session: AsyncSession = None,
):
    """Mark all messages in a conversation as read for a user."""
    # Update participant's last_read_at
    await update_participant_last_read(conversation_id, user_id, session)
    
    # Get all unread messages
    result = await session.execute(
        select(Message)
        .where(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.is_deleted == False,
            )
        )
    )
    messages = result.scalars().all()
    
    # Create read receipts for all messages
    for message in messages:
        await create_read_receipt(message.message_id, user_id, session)


async def get_message_read_by_users(
    message_id: UUID,
    session: AsyncSession = None,
) -> List[int]:
    """Get list of user IDs who have read a message."""
    result = await session.execute(
        select(MessageReadReceipt.user_id)
        .where(MessageReadReceipt.message_id == message_id)
    )
    return [row[0] for row in result.all()]

