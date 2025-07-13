from fastapi import HTTPException, status
import jwt
from ..config import settings

async def verify_token(token: str):
    """Verify JWT token from Supabase"""
    try:
        # Allow guest access with special token
        if token == "guest-access" or token.startswith("guest-"):
            return {
                "id": f"guest_{token.split('-')[-1] if '-' in token else 'anonymous'}",
                "email": "guest@datagenesis.ai",
                "name": "Guest User",
                "is_guest": True
            }
        
        # For now, return a mock user - replace with actual Supabase verification
        if token == "mock-token":
            return {
                "id": "user-123",
                "email": "user@example.com", 
                "name": "Test User",
                "is_guest": False
            }
        
        # In production, verify with Supabase:
        # decoded = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
        # return decoded
        
        return {
            "id": "guest-user",
            "email": "guest@datagenesis.ai",
            "name": "Guest User",
            "is_guest": True
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )