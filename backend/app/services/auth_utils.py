from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.hash import bcrypt
import secrets
import asyncio
import hashlib
from app.core import config

SECRET_KEY = config.JWT_SECRET_KEY
ALGORITHM = config.JWT_ALGORITHM
ACCESS_EXPIRE_MIN = 15
REFRESH_EXPIRE_DAYS = 7


# Password Hashing


async def hash_password(password: str) -> str:
    """Hash password asynchronously using bcrypt."""
    # Pre-hash long passwords to avoid bcrypt 72-byte limit
    if len(password.encode("utf-8")) > 72:
        password = hashlib.sha256(password.encode("utf-8")).hexdigest()

    # bcrypt is CPU-bound, so run in thread pool
    return await asyncio.to_thread(bcrypt.hash, password)


async def verify_password(password: str, hashed: str) -> bool:
    """Verify password asynchronously."""

    if len(password.encode("utf-8")) > 72:
        password = hashlib.sha256(password.encode("utf-8")).hexdigest()

    return await asyncio.to_thread(bcrypt.verify, password, hashed)


# Token Creation


async def create_tokens(user_id: int, role: str):
    """Create JWT access + random refresh tokens asynchronously."""
    access_payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_EXPIRE_MIN),
    }

    # JWT encoding is lightweight but let's keep async-friendly style
    access_token = await asyncio.to_thread(
        jwt.encode, access_payload, SECRET_KEY, ALGORITHM
    )

    refresh_token = secrets.token_urlsafe(32)
    refresh_exp = datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS)

    return access_token, refresh_token, refresh_exp
