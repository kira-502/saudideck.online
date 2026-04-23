from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _get_db():
    """Thin wrapper so patch('routers.dashboard._get_db', ...) is picked up at call-time."""
    yield from get_db()


def _count(model, where=None):
    stmt = select(func.count()).select_from(model)
    if where is not None:
        stmt = stmt.where(where)
    return stmt.scalar_subquery()


@router.get("/stats")
def get_stats(
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Single round trip: 7 count subqueries evaluated in one SELECT.
    row = db.execute(select(
        _count(models.SallaOrder).label("salla_orders"),
        _count(models.G2GOrder).label("g2g_orders"),
        _count(models.PlatiOrder).label("plati_orders"),
        _count(models.Z2UOrder).label("z2u_orders"),
        _count(models.Match).label("matches"),
        _count(models.User).label("users"),
        _count(models.ImportLog, models.ImportLog.imported_at >= today_start).label("imports_today"),
    )).one()

    stats = dict(row._mapping)

    log_action(db, user_id=current_user.id, username=current_user.username,
               action="view_dashboard", ip=request.client.host if request.client else None)
    return stats
