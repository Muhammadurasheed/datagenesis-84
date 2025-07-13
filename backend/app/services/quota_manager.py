"""
Quota Management System for DataGenesis
Manages usage tracking for different AI providers
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import redis
from ..config import settings

logger = logging.getLogger(__name__)

class QuotaManager:
    def __init__(self):
        self.redis_client = None
        self.quota_limits = {
            'gemini': {
                'daily_datasets': 100,  # Max 100 datasets per day for free users
                'daily_requests': 200,  # Max 200 API requests per day  
                'hourly_requests': 30,  # Max 30 requests per hour
                'reset_time': '00:00'   # Daily reset at midnight
            },
            'openai': {
                'daily_datasets': 50,   # Conservative limit
                'daily_requests': 100,
                'hourly_requests': 20
            },
            'anthropic': {
                'daily_datasets': 50,
                'daily_requests': 100,
                'hourly_requests': 20
            },
            'ollama': {
                'daily_datasets': 1000, # No external quota limits
                'daily_requests': -1,   # Unlimited
                'hourly_requests': -1   # Unlimited
            }
        }
        
    async def initialize(self):
        """Initialize Redis connection for quota tracking"""
        try:
            if hasattr(settings, 'redis_url') and settings.redis_url:
                self.redis_client = redis.from_url(settings.redis_url)
                await self.redis_client.ping()
                logger.info("✅ Quota Manager initialized with Redis")
            else:
                logger.warning("⚠️ Redis not configured - using in-memory quota tracking")
                self.redis_client = None
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed, using in-memory tracking: {str(e)}")
            self.redis_client = None
            
    async def check_quota(self, provider: str, user_id: str = "guest", request_type: str = "dataset") -> Dict[str, Any]:
        """Check if user has quota remaining for the request"""
        
        if provider not in self.quota_limits:
            return {"allowed": True, "remaining": -1, "message": "Provider not tracked"}
            
        limits = self.quota_limits[provider]
        
        # Ollama has no limits
        if provider == 'ollama':
            return {"allowed": True, "remaining": -1, "message": "No quota limits for local models"}
            
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            hour = datetime.now().strftime("%Y-%m-%d-%H")
            
            # Get current usage
            daily_key = f"quota:{provider}:{user_id}:daily:{today}"
            hourly_key = f"quota:{provider}:{user_id}:hourly:{hour}"
            
            if self.redis_client:
                daily_usage = int(await self.redis_client.get(daily_key) or 0)
                hourly_usage = int(await self.redis_client.get(hourly_key) or 0)
            else:
                # Fallback to in-memory (simplified)
                daily_usage = 0
                hourly_usage = 0
                
            # Check limits
            daily_limit = limits.get(f'daily_{request_type}s', limits.get('daily_requests', 100))
            hourly_limit = limits.get('hourly_requests', 30)
            
            if daily_limit > 0 and daily_usage >= daily_limit:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "message": f"Daily {request_type} limit reached ({daily_limit}). Resets at midnight.",
                    "reset_time": "00:00"
                }
                
            if hourly_limit > 0 and hourly_usage >= hourly_limit:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "message": f"Hourly request limit reached ({hourly_limit}). Try again next hour.",
                    "reset_time": f"{datetime.now().hour + 1:02d}:00"
                }
                
            remaining = daily_limit - daily_usage if daily_limit > 0 else -1
            
            return {
                "allowed": True,
                "remaining": remaining,
                "message": f"Quota available: {remaining} {request_type}s remaining today" if remaining > 0 else "Quota available"
            }
            
        except Exception as e:
            logger.error(f"❌ Quota check failed: {str(e)}")
            # Fail open - allow request if quota check fails
            return {"allowed": True, "remaining": -1, "message": "Quota check failed, allowing request"}
            
    async def consume_quota(self, provider: str, user_id: str = "guest", request_type: str = "dataset") -> bool:
        """Consume quota for a successful request"""
        
        if provider == 'ollama' or provider not in self.quota_limits:
            return True  # No quota to consume
            
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            hour = datetime.now().strftime("%Y-%m-%d-%H")
            
            daily_key = f"quota:{provider}:{user_id}:daily:{today}"
            hourly_key = f"quota:{provider}:{user_id}:hourly:{hour}"
            
            if self.redis_client:
                # Increment usage counters
                pipe = self.redis_client.pipeline()
                pipe.incr(daily_key)
                pipe.expire(daily_key, 86400)  # 24 hours
                pipe.incr(hourly_key)
                pipe.expire(hourly_key, 3600)  # 1 hour
                await pipe.execute()
                
                logger.info(f"✅ Quota consumed: {provider} - {request_type} for {user_id}")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to consume quota: {str(e)}")
            return True  # Don't block on quota tracking failure
            
    async def get_quota_status(self, provider: str, user_id: str = "guest") -> Dict[str, Any]:
        """Get current quota status for user"""
        
        if provider not in self.quota_limits:
            return {"provider": provider, "status": "not_tracked"}
            
        limits = self.quota_limits[provider]
        
        if provider == 'ollama':
            return {
                "provider": provider,
                "status": "unlimited",
                "limits": limits,
                "usage": {"daily": 0, "hourly": 0},
                "remaining": {"daily": -1, "hourly": -1}
            }
            
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            hour = datetime.now().strftime("%Y-%m-%d-%H")
            
            daily_key = f"quota:{provider}:{user_id}:daily:{today}"
            hourly_key = f"quota:{provider}:{user_id}:hourly:{hour}"
            
            if self.redis_client:
                daily_usage = int(await self.redis_client.get(daily_key) or 0)
                hourly_usage = int(await self.redis_client.get(hourly_key) or 0)
            else:
                daily_usage = 0
                hourly_usage = 0
                
            daily_limit = limits.get('daily_datasets', 100)
            hourly_limit = limits.get('hourly_requests', 30)
            
            return {
                "provider": provider,
                "status": "tracked",
                "limits": {
                    "daily_datasets": daily_limit,
                    "hourly_requests": hourly_limit
                },
                "usage": {
                    "daily": daily_usage,
                    "hourly": hourly_usage
                },
                "remaining": {
                    "daily": max(0, daily_limit - daily_usage) if daily_limit > 0 else -1,
                    "hourly": max(0, hourly_limit - hourly_usage) if hourly_limit > 0 else -1
                },
                "reset_times": {
                    "daily": "00:00",
                    "hourly": f"{datetime.now().hour + 1:02d}:00"
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get quota status: {str(e)}")
            return {"provider": provider, "status": "error", "message": str(e)}

# Global quota manager instance
quota_manager = QuotaManager()