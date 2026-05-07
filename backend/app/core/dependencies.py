from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_supabase_token

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency for protected routes. Extracts and verifies the Supabase JWT.
    Returns a minimal user dict: { id, email }.
    Raises 401 if the token is missing, invalid, or expired.
    """
    # payload = verify_supabase_token(credentials.credentials)
    # user_id = payload.get("sub")
    payload = verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub") or payload.get("id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user ID",
        )
    return {"id": user_id, "email": payload.get("email", "")}


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
) -> dict | None:
    """
    Dependency for routes that work for both guests and logged-in users.
    Returns the user dict if a valid token is present, None otherwise.
    """
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
