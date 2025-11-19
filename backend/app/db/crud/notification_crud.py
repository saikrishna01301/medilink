from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.notification_model import Notification, NotificationType, NotificationStatus


async def create_notification(
    session: AsyncSession,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    appointment_request_id: Optional[int] = None,
    appointment_id: Optional[int] = None,
    notification_metadata: Optional[dict] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        appointment_request_id=appointment_request_id,
        appointment_id=appointment_id,
        notification_metadata=notification_metadata or {},
        status=NotificationStatus.unread.value,
    )
    session.add(notification)
    await session.commit()
    await session.refresh(notification)
    return notification


async def get_notification_by_id(
    session: AsyncSession,
    notification_id: int,
) -> Optional[Notification]:
    stmt = select(Notification).where(Notification.notification_id == notification_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_notifications_for_user(
    session: AsyncSession,
    user_id: int,
    status: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> Iterable[Notification]:
    stmt = select(Notification).where(Notification.user_id == user_id)
    if status:
        stmt = stmt.where(Notification.status == status)
    stmt = stmt.order_by(Notification.created_at.desc())
    if limit:
        stmt = stmt.limit(limit)
    if offset:
        stmt = stmt.offset(offset)
    result = await session.execute(stmt)
    return result.scalars().all()


async def count_unread_notifications(
    session: AsyncSession,
    user_id: int,
) -> int:
    stmt = select(func.count(Notification.notification_id)).where(
        and_(
            Notification.user_id == user_id,
            Notification.status == NotificationStatus.unread.value
        )
    )
    result = await session.execute(stmt)
    return result.scalar() or 0


async def mark_notification_as_read(
    session: AsyncSession,
    notification_id: int,
) -> Optional[Notification]:
    notification = await get_notification_by_id(session, notification_id)
    if not notification:
        return None

    notification.status = NotificationStatus.read.value
    notification.read_at = datetime.utcnow()
    await session.commit()
    await session.refresh(notification)
    return notification


async def mark_all_notifications_as_read(
    session: AsyncSession,
    user_id: int,
) -> int:
    stmt = select(Notification).where(
        and_(
            Notification.user_id == user_id,
            Notification.status == NotificationStatus.unread.value
        )
    )
    result = await session.execute(stmt)
    notifications = result.scalars().all()
    
    count = 0
    for notification in notifications:
        notification.status = NotificationStatus.read.value
        notification.read_at = datetime.utcnow()
        count += 1
    
    await session.commit()
    return count


async def archive_notification(
    session: AsyncSession,
    notification_id: int,
) -> Optional[Notification]:
    notification = await get_notification_by_id(session, notification_id)
    if not notification:
        return None

    notification.status = NotificationStatus.archived.value
    notification.archived_at = datetime.utcnow()
    await session.commit()
    await session.refresh(notification)
    return notification


async def update_notification(
    session: AsyncSession,
    notification_id: int,
    *,
    status: Optional[str] = None,
    read_at: Optional[datetime] = None,
    archived_at: Optional[datetime] = None,
) -> Optional[Notification]:
    notification = await get_notification_by_id(session, notification_id)
    if not notification:
        return None

    if status is not None:
        notification.status = status
    if read_at is not None:
        notification.read_at = read_at
    if archived_at is not None:
        notification.archived_at = archived_at

    await session.commit()
    await session.refresh(notification)
    return notification

