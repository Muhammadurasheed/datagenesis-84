from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        await self.send_personal_message(
            json.dumps({"type": "connection", "message": "Connected successfully"}),
            client_id
        )
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except:
                # Connection might be closed
                self.disconnect(client_id)
                
    async def broadcast(self, message: str):
        disconnected = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except:
                disconnected.append(client_id)
                
        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)
            
    async def send_job_update(self, job_id: str, update: Dict):
        """Send job-specific updates to all connected clients"""
        message = json.dumps({
            "type": "job_update",
            "job_id": job_id,
            "data": update
        })
        await self.broadcast(message)
        
    async def send_agent_update(self, agent_id: str, status: Dict):
        """Send agent status updates"""
        message = json.dumps({
            "type": "agent_update",
            "agent_id": agent_id,
            "status": status
        })
        await self.broadcast(message)
        
    async def send_system_metrics(self, metrics: Dict):
        """Send system-wide metrics updates"""
        message = json.dumps({
            "type": "system_metrics",
            "data": metrics
        })
        await self.broadcast(message)