from typing import Optional
from fastapi import Cookie, Depends, HTTPException, Request, status
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from config import SECRET_KEY, SESSION_MAX_AGE
from database import get_db
import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_serializer = URLSafeTimedSerializer(SECRET_KEY)
COOKIE_NAME = "hub_session"


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_session_token(user_id: int, session_version: int) -> str:
    return _serializer.dumps({"uid": user_id, "ver": session_version})


def decode_session_token(token: str) -> Optional[dict]:
    try:
        data = _serializer.loads(token, max_age=SESSION_MAX_AGE)
        return {"uid": data["uid"], "ver": data.get("ver", 0)}
    except (BadSignature, SignatureExpired, KeyError, TypeError):
        return None


def get_current_user(
    session: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> models.User:
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_session_token(session)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    user = db.get(models.User, payload["uid"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if payload["ver"] != user.session_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user
