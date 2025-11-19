"""
Redis service for chat system - handles connection, caching, and message queue.
Uses redis.asyncio for async operations (compatible with Python 3.12+).
"""
import redis.asyncio as aioredis
from typing import Optional
from core import config
import json
import logging

logger = logging.getLogger(__name__)

# Global Redis connection pool
_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Get or create Redis client connection."""
    global _redis_client
    
    if _redis_client is None:
        try:
            if config.REDIS_URL:
                # Use Redis URL if provided (for cloud services like Redis Cloud, Upstash, etc.)
                _redis_client = aioredis.from_url(
                    config.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                )
            else:
                # Use host/port configuration
                redis_url = f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}"
                if config.REDIS_PASSWORD:
                    redis_url = f"redis://:{config.REDIS_PASSWORD}@{config.REDIS_HOST}:{config.REDIS_PORT}"
                
                _redis_client = aioredis.from_url(
                    redis_url,
                    db=config.REDIS_DB,
                    encoding="utf-8",
                    decode_responses=True,
                )
            # Test connection
            await _redis_client.ping()
            logger.info("Redis client connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            _redis_client = None
            raise
    
    return _redis_client


async def close_redis_client():
    """Close Redis connection on application shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis client closed")


# Cache helper functions
async def get_cache(key: str) -> Optional[str]:
    """Get value from Redis cache."""
    try:
        client = await get_redis_client()
        return await client.get(key)
    except Exception as e:
        logger.error(f"Error getting cache key {key}: {e}")
        return None


async def set_cache(key: str, value: str, ttl: int = 300) -> bool:
    """Set value in Redis cache with TTL (default 5 minutes)."""
    try:
        client = await get_redis_client()
        await client.setex(key, ttl, value)
        return True
    except Exception as e:
        logger.error(f"Error setting cache key {key}: {e}")
        return False


async def delete_cache(key: str) -> bool:
    """Delete key from Redis cache."""
    try:
        client = await get_redis_client()
        await client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Error deleting cache key {key}: {e}")
        return False


async def invalidate_conversation_cache(conversation_id: str):
    """Invalidate all cache related to a conversation."""
    patterns = [
        f"conversation:{conversation_id}:messages:*",
        f"conversation:{conversation_id}:participants",
    ]
    client = await get_redis_client()
    for pattern in patterns:
        keys = await client.keys(pattern)
        if keys:
            await client.delete(*keys)


async def publish_message(channel: str, message: dict):
    """Publish message to Redis pub/sub channel."""
    try:
        client = await get_redis_client()
        await client.publish(channel, json.dumps(message))
    except Exception as e:
        logger.error(f"Error publishing to channel {channel}: {e}")


async def subscribe_to_channel(channel: str):
    """Subscribe to Redis pub/sub channel. Returns pubsub object."""
    try:
        client = await get_redis_client()
        pubsub = client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
    except Exception as e:
        logger.error(f"Error subscribing to channel {channel}: {e}")
        raise

