from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    address_line1: str = Field(..., max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country_code: Optional[str] = Field(None, max_length=2)
    label: Optional[str] = Field(
        None,
        max_length=50,
        description="Friendly label such as 'Home' or 'Primary Clinic'.",
    )

    class Config:
        from_attributes = True


class AddressUpdate(AddressBase):
    """Payload used by account settings to create/update the primary address."""

    pass


class AddressRead(AddressBase):
    address_id: int = Field(..., validation_alias="id", serialization_alias="address_id")
    user_id: int
    formatted_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    location_source: Optional[str] = None
    timezone: Optional[str] = None
    raw_geocoding_payload: Optional[Dict[str, Any]] = Field(default=None, exclude_if_none=False)
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True


