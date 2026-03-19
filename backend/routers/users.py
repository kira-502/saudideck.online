from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/users", tags=["users"])


def _get_db():
    """Thin wrapper so patch('routers.users._get_db', ...) is picked up at call-time."""
    yield from get_db()


@router.get("")
def list_users(
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_users", ip=request.client.host if request.client else None)
    return [
        {"id": u.id, "username": u.username, "role": u.role,
         "created_at": u.created_at, "last_login": u.last_login}
        for u in users
    ]
