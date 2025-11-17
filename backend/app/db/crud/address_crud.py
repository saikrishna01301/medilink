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
    return list(result.scalars().all())


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
    
    # Filter out None values for raw_geocoding_payload to avoid JSONB type issues
    filtered_data = {
        k: v for k, v in address_data.items()
        if not (k == "raw_geocoding_payload" and v is None)
    }

    if existing:
        for key, value in filtered_data.items():
            setattr(existing, key, value)
        await session.commit()
        await session.refresh(existing)
        return existing

    new_address = Address(user_id=user_id, **filtered_data)
    session.add(new_address)
    await session.commit()
    await session.refresh(new_address)
    return new_address


async def get_address_by_id(
    address_id: int, user_id: int, session: AsyncSession
) -> Optional[Address]:
    """Get a specific address by ID, ensuring it belongs to the user."""
    result = await session.execute(
        select(Address)
        .where(Address.id == address_id, Address.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_address_for_user(
    user_id: int, address_data: Dict[str, Any], session: AsyncSession
) -> Address:
    """Create a new address for a user."""
    new_address = Address(user_id=user_id, **address_data)
    session.add(new_address)
    await session.commit()
    await session.refresh(new_address)
    return new_address


async def update_address_for_user(
    address_id: int, user_id: int, address_data: Dict[str, Any], session: AsyncSession
) -> Optional[Address]:
    """Update an existing address, ensuring it belongs to the user."""
    address = await get_address_by_id(address_id, user_id, session)
    if not address:
        return None
    
    # Filter out raw_geocoding_payload if it's None to avoid JSONB type issues
    # Only update fields that are provided and not None for this field
    for key, value in address_data.items():
        # Skip raw_geocoding_payload if it's None
        if key == "raw_geocoding_payload" and value is None:
            continue
        setattr(address, key, value)
    
    await session.commit()
    await session.refresh(address)
    return address


async def delete_address_for_user(
    address_id: int, user_id: int, session: AsyncSession
) -> bool:
    """Delete an address, ensuring it belongs to the user."""
    address = await get_address_by_id(address_id, user_id, session)
    if not address:
        return False
    
    await session.delete(address)
    await session.commit()
    return True


async def set_primary_address(
    address_id: int, user_id: int, session: AsyncSession
) -> Optional[Address]:
    """Set an address as primary, unsetting all other primary addresses for the user."""
    address = await get_address_by_id(address_id, user_id, session)
    if not address:
        return None
    
    # Unset all other primary addresses for this user
    result = await session.execute(
        select(Address)
        .where(Address.user_id == user_id, Address.is_primary.is_(True))
    )
    for addr in result.scalars():
        addr.is_primary = False
    
    # Set this address as primary
    address.is_primary = True
    await session.commit()
    await session.refresh(address)
    return address


