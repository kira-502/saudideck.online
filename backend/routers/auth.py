from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from auth import (
    verify_password, hash_password, create_session_token, get_current_user, COOKIE_NAME,
)
from config import SESSION_MAX_AGE
from audit import log_action
from database import get_db
import models

router = APIRouter(tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def _get_db():
    """Thin wrapper so patch('routers.auth.get_db', ...) is picked up at call-time."""
    yield from get_db()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
@limiter.limit("10/minute")
def login(body: LoginRequest, request: Request, response: Response, db: Session = Depends(_get_db)):
    uname = (body.username or "").strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.username) == uname).first()
    try:
        password_ok = user is not None and verify_password(body.password, user.password_hash)
    except Exception:
        password_ok = False
    if not user or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_session_token(user.id, user.session_version)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=True,
        max_age=SESSION_MAX_AGE,
    )
    log_action(db, user_id=user.id, username=user.username,
               action="login", ip=request.client.host if request.client else None)
    return {"ok": True, "username": user.username}


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Bump session_version so the current token (and any copies) is rejected.
    current_user.session_version = (current_user.session_version or 0) + 1
    db.commit()
    response.delete_cookie(key=COOKIE_NAME, httponly=True, samesite="lax", secure=True, path="/")
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="logout", ip=request.client.host if request.client else None)
    return {"ok": True}


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
@limiter.limit("5/minute")
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    response: Response,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is wrong")
    new_pw = body.new_password or ""
    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    if new_pw == body.current_password:
        raise HTTPException(status_code=400, detail="New password must differ from current")

    current_user.password_hash = hash_password(new_pw)
    # Bump so other devices' tokens are invalidated; reissue cookie for this one.
    current_user.session_version = (current_user.session_version or 0) + 1
    db.commit()

    token = create_session_token(current_user.id, current_user.session_version)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=True,
        max_age=SESSION_MAX_AGE,
    )
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="password_changed", ip=request.client.host if request.client else None)
    return {"ok": True}
