
from fastapi import WebSocket
from typing import Dict, List
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """Connect a new WebSocket client"""
        await websocket.accept()
        
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        
        self.active_connections[client_id].append(websocket)
        logger.info(f"🔌 WebSocket connected: {client_id}")
        
    def disconnect(self, client_id: str, websocket: WebSocket = None):
        """Disconnect a WebSocket client"""
        if client_id in self.active_connections:
            if websocket:
                try:
                    self.active_connections[client_id].remove(websocket)
                except ValueError:
                    pass
            
            # Clean up empty connection lists
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
                
        logger.info(f"🔌 WebSocket disconnected: {client_id}")
        
    async def send_personal_message(self, message: str, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            # Send to all connections for this client
            disconnected = []
            for websocket in self.active_connections[client_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send message to {client_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(client_id, ws)
                
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        disconnected_clients = []
        
        for client_id, connections in self.active_connections.items():
            disconnected_ws = []
            for websocket in connections:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to broadcast to {client_id}: {e}")
                    disconnected_ws.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected_ws:
                self.disconnect(client_id, ws)
                
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        total = sum(len(connections) for connections in self.active_connections.values())
        return total
        
    def get_client_count(self) -> int:
        """Get number of unique clients"""
        return len(self.active_connections)
