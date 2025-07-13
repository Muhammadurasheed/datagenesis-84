import redis.asyncio as redis
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import asyncio

from ..config import settings

class RedisService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis_client = redis.from_url(
            settings.redis_url,
            password=settings.redis_password,
            decode_responses=True
        )
        await self.redis_client.ping()
        print("✅ Redis connected successfully")
        
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            
    async def ping(self) -> bool:
        """Check Redis health"""
        try:
            await self.redis_client.ping()
            return True
        except:
            return False
            
    # Caching Operations
    async def set_cache(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set cache with optional TTL"""
        ttl = ttl or settings.default_cache_ttl
        return await self.redis_client.setex(
            key, 
            ttl, 
            json.dumps(value) if not isinstance(value, str) else value
        )
        
    async def get_cache(self, key: str) -> Optional[Any]:
        """Get cached value"""
        value = await self.redis_client.get(key)
        if value:
            try:
                return json.loads(value)
            except:
                return value
        return None
        
    async def delete_cache(self, key: str) -> bool:
        """Delete cached value"""
        return bool(await self.redis_client.delete(key))
        
    # Real-time Metrics
    async def increment_metric(self, metric: str, amount: int = 1) -> int:
        """Increment a metric counter"""
        return await self.redis_client.incrby(f"metric:{metric}", amount)
        
    async def set_metric(self, metric: str, value: Any) -> bool:
        """Set a metric value"""
        return await self.redis_client.set(f"metric:{metric}", json.dumps(value))
        
    async def get_metric(self, metric: str) -> Optional[Any]:
        """Get a metric value"""
        value = await self.redis_client.get(f"metric:{metric}")
        if value:
            try:
                return json.loads(value)
            except:
                return value
        return None
        
    # Session Management
    async def store_user_session(self, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Store user session data"""
        return await self.redis_client.setex(
            f"session:{user_id}",
            7200,  # 2 hours
            json.dumps(session_data)
        )
        
    async def get_user_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user session data"""
        return await self.get_cache(f"session:{user_id}")
        
    # Agent Status
    async def set_agent_status(self, agent_id: str, status: Dict[str, Any]) -> bool:
        """Set agent status"""
        return await self.redis_client.setex(
            f"agent:{agent_id}",
            300,  # 5 minutes
            json.dumps({
                **status,
                "last_updated": datetime.utcnow().isoformat()
            })
        )
        
    async def get_agent_status(self) -> Dict[str, Any]:
        """Get all agent statuses"""
        agents = {}
        agent_keys = await self.redis_client.keys("agent:*")
        
        for key in agent_keys:
            agent_id = key.split(":", 1)[1]
            status = await self.get_cache(key)
            if status:
                agents[agent_id] = status
                
        return agents
        
    # Generation Job Tracking
    async def start_generation_job(self, job_id: str, job_data: Dict[str, Any]) -> bool:
        """Start tracking a generation job"""
        job_data.update({
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "progress": 0
        })
        await self.increment_metric("active_generations")
        return await self.redis_client.setex(
            f"job:{job_id}",
            3600,  # 1 hour
            json.dumps(job_data)
        )
        
    async def update_job_progress(self, job_id: str, progress: int, status: str = None) -> bool:
        """Update job progress"""
        job = await self.get_cache(f"job:{job_id}")
        if job:
            job["progress"] = progress
            job["last_updated"] = datetime.utcnow().isoformat()
            if status:
                job["status"] = status
            return await self.set_cache(f"job:{job_id}", job, 3600)
        return False
        
    async def complete_generation_job(self, job_id: str, result: Dict[str, Any]) -> bool:
        """Mark job as completed"""
        job = await self.get_cache(f"job:{job_id}")
        if job:
            job.update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "progress": 100,
                "result": result
            })
            await self.redis_client.decrby("metric:active_generations", 1)
            return await self.set_cache(f"job:{job_id}", job, 3600)
        return False
        
    # System Metrics
    async def get_system_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics"""
        metrics = {}
        metric_keys = await self.redis_client.keys("metric:*")
        
        for key in metric_keys:
            metric_name = key.split(":", 1)[1]
            value = await self.get_metric(metric_name)
            metrics[metric_name] = value
            
        return metrics
        
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return {
            "avg_generation_time": await self.get_metric("avg_generation_time") or 0,
            "success_rate": await self.get_metric("success_rate") or 100,
            "total_generations": await self.get_metric("total_generations") or 0,
            "total_datasets": await self.get_metric("total_datasets") or 0,
            "cpu_usage": await self.get_metric("cpu_usage") or 0,
            "memory_usage": await self.get_metric("memory_usage") or 0
        }
        
    # Pub/Sub for Real-time Updates
    async def publish_update(self, channel: str, message: Dict[str, Any]) -> int:
        """Publish real-time update"""
        return await self.redis_client.publish(
            channel,
            json.dumps({
                **message,
                "timestamp": datetime.utcnow().isoformat()
            })
        )
        
    async def subscribe_to_updates(self, channels: List[str]):
        """Subscribe to real-time updates"""
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(*channels)
        return pubsub