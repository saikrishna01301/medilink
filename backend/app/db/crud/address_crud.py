from __future__ import annotations

from typing import Optional, List, Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db import Address


async def get_primary_address_for_user(
    user_id: int, session: AsyncSession
) -> Optional[Address]:
    """Return the primary address for a user, if one exists."""
    result = await session.execute(
        select(Address)
        .where(Address.user_id == user_id, Address.is_primary.is_(True))
        .order_by(Address.id.asc())
    )
    return result.scalar_one_or_none()


async def list_addresses_for_user(
    user_id: int, session: AsyncSession
) -> List[Address]:
    """Return all addresses for a user (primary first)."""
    result = await session.execute(
        select(Address)
        .where(Address.user_id == user_id)
        .order_by(Address.is_primary.desc(), Address.id.asc())
    )
    return [addr for (addr,) in result.all()]


async def upsert_primary_address_for_user(
    user_id: int, address_data: Dict[str, Any], session: AsyncSession
) -> Address:
    """
    Create or update the primary address for a user.

    Only one row per user will have is_primary = TRUE. If a primary address already
    exists, it is updated in-place; otherwise, a new row is created.
    """
    existing = await get_primary_address_for_user(user_id, session)

    # Always enforce is_primary=True for this helper
    address_data = {**address_data, "is_primary": True}

    if existing:
        for key, value in address_data.items():
            setattr(existing, key, value)
        await session.commit()
        await session.refresh(existing)
        return existing

    new_address = Address(user_id=user_id, **address_data)
    session.add(new_address)
    await session.commit()
    await session.refresh(new_address)
    return new_address


