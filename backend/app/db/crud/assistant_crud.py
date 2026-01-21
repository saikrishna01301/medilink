from sqlalchemy import select, delete
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from db import ChatHistory


# here role is belongs to model not medilink
async def save_chat(
    session: AsyncSession,
    user_id: int,
    role: str,
    content: str,
    citations: Optional[list] = None,
):
    message = ChatHistory(
        user_id=user_id, role=role, content=content, citations=citations
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


# get n number of messages
async def get_recent_messages(session: AsyncSession, user_id: int, limit: int = 20):
    stmt = (
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()
    # reverse to oldest → newest order
    return list(reversed(rows))


# clear chat history of user
async def clear_chat_history(session: AsyncSession, user_id: int):
    query = delete(ChatHistory).where(ChatHistory.user_id == user_id)
    await session.execute(query)
    await session.commit()
    return {"status": "cleared"}


# get last message
async def get_last_message(session, user_id: int):
    stmt = (
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.id.desc())
        .limit(1)
    )

    result = await session.execute(stmt)
    return result.scalar_one_or_none()
