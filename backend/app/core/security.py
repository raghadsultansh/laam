from fastapi import HTTPException, status
from app.db.supabase import supabase


def verify_supabase_token(token: str) -> dict:
    """
    Validates a Supabase JWT by asking Supabase directly.
    Works regardless of whether the project uses legacy HS256 or newer signing keys.
    """
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"id": str(user.id), "email": user.email or ""}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
