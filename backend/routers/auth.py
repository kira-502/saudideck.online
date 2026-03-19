from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from auth import (
    verify_password, create_session_token, get_current_user, COOKIE_NAME,
)
from audit import log_action
from database import get_db
import models

router = APIRouter(tags=["auth"])


def _get_db():
    """Thin wrapper so patch('routers.auth.get_db', ...) is picked up at call-time."""
    yield from get_db()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginRequest, request: Request, response: Response, db: Session = Depends(_get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    try:
        password_ok = user is not None and verify_password(body.password, user.password_hash)
    except Exception:
        password_ok = False
    if not user or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_session_token(user.id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=True,
        max_age=86400,
    )
    log_action(db, user_id=user.id, username=user.username,
               action="login", ip=request.client.host if request.client else None)
    return {"ok": True, "username": user.username}


@router.post("/logout")
def logout(response: Response, current_user: models.User = Depends(get_current_user)):
    response.delete_cookie(key=COOKIE_NAME)
    return {"ok": True}


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}
