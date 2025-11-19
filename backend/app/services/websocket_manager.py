"""
WebSocket connection manager for chat system.
Handles WebSocket connections, authentication, and message broadcasting.
"""
from fastapi import WebSocket, WebSocketDisconnect, status
from typing import Dict, Set, Optional
import json
import logging
from services.auth_utils import verify_access_token
from services.redis_service import publish_message

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for chat system."""
    
    def __init__(self):
        # Map of user_id -> Set of WebSocket connections
        # Users can have multiple connections (multiple tabs/devices)
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Map of WebSocket -> user_id for quick lookup
        self.connection_to_user: Dict[WebSocket, int] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept WebSocket connection and register user."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_to_user[websocket] = user_id
        
        logger.info(f"User {user_id} connected. Total connections: {len(self.connection_to_user)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection."""
        user_id = self.connection_to_user.get(websocket)
        if user_id:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            del self.connection_to_user[websocket]
            logger.info(f"User {user_id} disconnected. Total connections: {len(self.connection_to_user)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to all connections of a specific user."""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.disconnect(connection)
    
    async def send_to_connection(self, message: dict, websocket: WebSocket):
        """Send message to a specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message to connection: {e}")
            self.disconnect(websocket)
            raise
    
    async def broadcast_to_conversation(self, message: dict, user_ids: list[int]):
        """Broadcast message to all participants in a conversation."""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user has any active connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_users(self) -> Set[int]:
        """Get set of all online user IDs."""
        return set(self.active_connections.keys())


# Global connection manager instance
manager = ConnectionManager()


async def authenticate_websocket(websocket: WebSocket) -> Optional[int]:
    """
    Authenticate WebSocket connection using JWT token.
    Token can be passed as query parameter or in cookie.
    Returns user_id if authenticated, None otherwise.
    """
    try:
        # Try to get token from query parameters first
        token = websocket.query_params.get("token")
        
        # If not in query, try to get from cookies
        if not token:
            cookies = websocket.cookies
            token = cookies.get("access_token")
        
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication required")
            return None
        
        # Verify token
        payload = await verify_access_token(token)
        user_id = int(payload.get("sub"))
        
        return user_id
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return None

