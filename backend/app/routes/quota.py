"""
Quota Management Routes for DataGenesis
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging

from ..services.quota_manager import quota_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/quota", tags=["quota"])

# Optional authentication - allow both authenticated and guest users
security = HTTPBearer(auto_error=False)

@router.get("/status")
async def get_quota_status(
    provider: str = "gemini",
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get current quota status for a user"""
    try:
        # Determine user ID
        user_id = "guest"
        if credentials and credentials.credentials:
            # In a real app, you'd decode the token to get user ID
            user_id = "authenticated_user"
            
        status = await quota_manager.get_quota_status(provider, user_id)
        
        return {
            "status": "success",
            "quota": status,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get quota status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check")
async def check_quota(
    provider: str = "gemini",
    request_type: str = "dataset",
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Check if user has quota remaining for a specific request type"""
    try:
        # Determine user ID
        user_id = "guest"
        if credentials and credentials.credentials:
            user_id = "authenticated_user"
            
        quota_check = await quota_manager.check_quota(provider, user_id, request_type)
        
        return {
            "status": "success",
            "quota_check": quota_check,
            "user_id": user_id,
            "provider": provider,
            "request_type": request_type
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to check quota: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/limits")
async def get_quota_limits():
    """Get quota limits for all providers"""
    try:
        return {
            "status": "success",
            "limits": quota_manager.quota_limits,
            "description": {
                "gemini": "Free tier limits: 100 datasets/day, 200 requests/day, 30 requests/hour",
                "openai": "Conservative limits: 50 datasets/day, 100 requests/day, 20 requests/hour", 
                "anthropic": "Conservative limits: 50 datasets/day, 100 requests/day, 20 requests/hour",
                "ollama": "No limits - local processing"
            },
            "recommendations": {
                "gemini": "Best for daily data generation with generous free tier",
                "ollama": "Best for unlimited local generation with models like phi3:mini",
                "openai": "Premium option with latest models",
                "anthropic": "Premium option with Claude models"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get quota limits: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_quota(
    provider: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Reset quota for a user (admin function)"""
    try:
        # In a real app, you'd validate admin permissions here
        if not credentials or not credentials.credentials:
            raise HTTPException(status_code=401, detail="Authentication required for quota reset")
            
        # This would reset quota in Redis - simplified for now
        logger.info(f"🔄 Quota reset requested for {provider}")
        
        return {
            "status": "success",
            "message": f"Quota reset for {provider}",
            "note": "Feature not fully implemented - contact admin"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to reset quota: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))