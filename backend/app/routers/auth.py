import os
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.database import fetch_one

router = APIRouter()
SECRET = os.getenv("JWT_SECRET", "dev-secret")
EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 8))


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(req: LoginRequest):
    user = await fetch_one(
        "select * from users where username = $1", req.username
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user["password_hash"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": user["user_code"],
        "username": user["username"],
        "role": user["role"],
        "linked_code": user["linked_code"],
        "display_name": user["display_name"],
        "exp": datetime.utcnow() + timedelta(hours=EXPIRE_HOURS),
    }
    token = jwt.encode(payload, SECRET, algorithm="HS256")
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "linked_code": user["linked_code"],
        "display_name": user["display_name"],
    }


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_claims(authorization: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return decode_token(authorization.split(" ")[1])