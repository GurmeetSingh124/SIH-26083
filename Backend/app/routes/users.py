from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/register")
def register(user: UserCreate):
    # Demo response. Add database hashing/authentication before production use.
    return {
        "message": "User registered successfully (demo)",
        "user": {"name": user.name, "email": user.email}
    }

@router.post("/login")
def login(user: UserCreate):
    return {
        "message": "Login endpoint ready (demo)",
        "email": user.email,
        "token": "demo-token-replace-with-jwt"
    }
