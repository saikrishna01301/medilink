from __future__ import annotations

import asyncio
from typing import Optional, Dict, Any
import requests
from fastapi import HTTPException, status

from core import config


async def fetch_place_details_by_address(
    address: str,
) -> Optional[Dict[str, Any]]:
    """
    Fetch Google Places data for a given address string.
    Returns rating, user_ratings_total, place_id, and formatted_address if found.
    """
    if not config.GOOGLE_MAPS_API_KEY:
        return None

    def _call() -> Optional[Dict[str, Any]]:
        try:
            url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
            params = {
                "input": address,
                "inputtype": "textquery",
                "fields": "place_id,formatted_address,rating,user_ratings_total,name,geometry",
                "key": config.GOOGLE_MAPS_API_KEY,
            }
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK" or not data.get("candidates"):
                return None

            candidate = data["candidates"][0]
            geometry = candidate.get("geometry", {})
            location = geometry.get("location", {})

            return {
                "place_id": candidate.get("place_id"),
                "formatted_address": candidate.get("formatted_address"),
                "rating": candidate.get("rating"),
                "user_ratings_total": candidate.get("user_ratings_total"),
                "name": candidate.get("name"),
                "latitude": location.get("lat"),
                "longitude": location.get("lng"),
            }
        except requests.RequestException:
            return None
        except Exception:
            return None

    return await asyncio.to_thread(_call)


async def fetch_place_details_by_place_id(
    place_id: str,
) -> Optional[Dict[str, Any]]:
    """
    Fetch Google Places details using a place_id.
    Returns rating, user_ratings_total, and other details.
    """
    if not config.GOOGLE_MAPS_API_KEY or not place_id:
        return None

    def _call() -> Optional[Dict[str, Any]]:
        try:
            url = "https://maps.googleapis.com/maps/api/place/details/json"
            params = {
                "place_id": place_id,
                "fields": "rating,user_ratings_total,formatted_address,name,geometry",
                "key": config.GOOGLE_MAPS_API_KEY,
            }
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK" or not data.get("result"):
                return None

            result = data["result"]
            geometry = result.get("geometry", {})
            location = geometry.get("location", {})

            return {
                "place_id": place_id,
                "formatted_address": result.get("formatted_address"),
                "rating": result.get("rating"),
                "user_ratings_total": result.get("user_ratings_total"),
                "name": result.get("name"),
                "latitude": location.get("lat"),
                "longitude": location.get("lng"),
            }
        except requests.RequestException:
            return None
        except Exception:
            return None

    return await asyncio.to_thread(_call)

