from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _get_db():
    """Thin wrapper so patch('routers.dashboard._get_db', ...) is picked up at call-time."""
    yield from get_db()


@router.get("/stats")
def get_stats(
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    stats = {
        "salla_orders": db.query(models.SallaOrder).count(),
        "g2g_orders": db.query(models.G2GOrder).count(),
        "plati_orders": db.query(models.PlatiOrder).count(),
        "z2u_orders": db.query(models.Z2UOrder).count(),
        "matches": db.query(models.Match).count(),
        "users": db.query(models.User).count(),
        "imports_today": db.query(models.ImportLog)
            .filter(models.ImportLog.imported_at >= today_start)
            .count(),
    }

    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_dashboard", ip=request.client.host if request.client else None)
    return stats
