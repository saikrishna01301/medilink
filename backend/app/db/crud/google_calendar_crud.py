from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.google_calendar_model import GoogleCalendarCredential


async def get_credentials(
    session: AsyncSession,
    *,
    user_id: int,
) -> Optional[GoogleCalendarCredential]:
    stmt = select(GoogleCalendarCredential).where(
        GoogleCalendarCredential.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def upsert_credentials(
    session: AsyncSession,
    *,
    user_id: int,
    access_token: str,
    refresh_token: Optional[str],
    token_type: Optional[str],
    expires_at: Optional[datetime],
    scope: Optional[str],
    raw_credentials: Optional[str],
) -> GoogleCalendarCredential:
    existing = await get_credentials(session, user_id=user_id)
    now = datetime.now(timezone.utc)

    if existing:
        await session.execute(
            update(GoogleCalendarCredential)
            .where(GoogleCalendarCredential.id == existing.id)
            .values(
                access_token=access_token,
                refresh_token=refresh_token or existing.refresh_token,
                token_type=token_type,
                expires_at=expires_at,
                scope=scope,
                raw_credentials=raw_credentials,
                updated_at=now,
            )
        )
        await session.commit()
        await session.refresh(existing)
        return existing

    credential = GoogleCalendarCredential(
        user_id=user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type=token_type,
        expires_at=expires_at,
        scope=scope,
        raw_credentials=raw_credentials,
    )
    session.add(credential)
    await session.commit()
    await session.refresh(credential)
    return credential


async def delete_credentials(
    session: AsyncSession,
    *,
    user_id: int,
) -> None:
    credential = await get_credentials(session, user_id=user_id)
    if credential:
        await session.delete(credential)
        await session.commit()

