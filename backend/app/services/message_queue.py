"""
Message queue service using Redis pub/sub for chat system.
"""
import json
import logging
from typing import Dict, Any
from services.redis_service import get_redis_client, subscribe_to_channel, publish_message
import asyncio

logger = logging.getLogger(__name__)

# Redis channel names
CHANNEL_NEW_MESSAGE = "chat:new_message"
CHANNEL_TYPING = "chat:typing"
CHANNEL_USER_ONLINE = "chat:user_online"
CHANNEL_USER_OFFLINE = "chat:user_offline"


async def publish_new_message(message_data: Dict[str, Any]):
    """Publish a new message to the message queue."""
    try:
        await publish_message(CHANNEL_NEW_MESSAGE, message_data)
        logger.debug(f"Published new message: {message_data.get('message_id')}")
    except Exception as e:
        logger.error(f"Error publishing new message: {e}")
        raise


async def publish_typing_indicator(conversation_id: str, user_id: int, is_typing: bool):
    """Publish typing indicator to the message queue."""
    try:
        data = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": is_typing,
        }
        await publish_message(CHANNEL_TYPING, data)
    except Exception as e:
        logger.error(f"Error publishing typing indicator: {e}")


async def publish_user_status(user_id: int, is_online: bool):
    """Publish user online/offline status."""
    try:
        channel = CHANNEL_USER_ONLINE if is_online else CHANNEL_USER_OFFLINE
        data = {
            "user_id": user_id,
            "is_online": is_online,
        }
        await publish_message(channel, data)
    except Exception as e:
        logger.error(f"Error publishing user status: {e}")


async def subscribe_to_messages(callback):
    """
    Subscribe to new messages channel and call callback for each message.
    Callback should be async function that takes message_data dict.
    """
    try:
        pubsub = await subscribe_to_channel(CHANNEL_NEW_MESSAGE)
        logger.info(f"Subscribed to channel: {CHANNEL_NEW_MESSAGE}")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await callback(data)
                except Exception as e:
                    logger.error(f"Error processing message from queue: {e}")
    except Exception as e:
        logger.error(f"Error subscribing to messages: {e}")
        raise

