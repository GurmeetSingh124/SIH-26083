"""
Route me `current_user = Depends(get_current_user)` likhne se
JWT token verify hoke logged-in user ki details mil jaati hain.
"""
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.security import decode_access_token
from app.database.mongo import get_users_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Login expire ho gaya ya invalid hai, dobara login karein",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None or "user_id" not in payload:
        raise credentials_exception

    users = get_users_collection()
    user = await users.find_one({"_id": ObjectId(payload["user_id"])})
    if user is None:
        raise credentials_exception

    user["id"] = str(user["_id"])
    return user
