from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from db import get_session
from db.crud import auth_crud, notification_crud
from schemas import NotificationRead, NotificationUpdate
from services import verify_access_token

router = APIRouter()


async def get_authenticated_user(
    access_token: str = Cookie(None), session: AsyncSession = Depends(get_session)
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = await verify_access_token(access_token)
    user_id = int(payload.get("sub"))

    user = await auth_crud.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: Optional[int] = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """List notifications for the current user"""
    notifications = await notification_crud.list_notifications_for_user(
        session,
        user_id=current_user.id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return list(notifications)


@router.get("/unread/count", response_model=dict)
async def get_unread_count(
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Get count of unread notifications for the current user"""
    count = await notification_crud.count_unread_notifications(
        session,
        user_id=current_user.id,
    )
    return {"count": count}


@router.get("/{notification_id}", response_model=NotificationRead)
async def get_notification(
    notification_id: int,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific notification"""
    notification = await notification_crud.get_notification_by_id(
        session,
        notification_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this notification"
        )

    return notification


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_as_read(
    notification_id: int,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Mark a notification as read"""
    notification = await notification_crud.get_notification_by_id(
        session,
        notification_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this notification"
        )

    updated = await notification_crud.mark_notification_as_read(
        session,
        notification_id,
    )
    return updated


@router.post("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Mark all notifications as read for the current user"""
    count = await notification_crud.mark_all_notifications_as_read(
        session,
        user_id=current_user.id,
    )
    return {"count": count}


@router.patch("/{notification_id}/archive", response_model=NotificationRead)
async def archive_notification(
    notification_id: int,
    current_user = Depends(get_authenticated_user),
    session: AsyncSession = Depends(get_session),
):
    """Archive a notification"""
    notification = await notification_crud.get_notification_by_id(
        session,
        notification_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to archive this notification"
        )

    updated = await notification_crud.archive_notification(
        session,
        notification_id,
    )
    return updated

