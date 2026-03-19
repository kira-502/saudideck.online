from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from auth import get_current_user
from database import get_db
import models

router = APIRouter(prefix="/audit-logs", tags=["audit"])
PAGE_SIZE = 100


def _get_db():
    """Thin wrapper so patch('routers.audit_logs._get_db', ...) is picked up at call-time."""
    yield from get_db()


@router.get("")
def list_audit_logs(
    page: int = Query(1, ge=1),
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.HubAuditLog).count()
    rows = (
        db.query(models.HubAuditLog)
        .order_by(models.HubAuditLog.timestamp.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all()
    )
    return {
        "total": total, "page": page, "page_size": PAGE_SIZE,
        "items": [
            {"id": r.id, "timestamp": r.timestamp, "username": r.username,
             "action": r.action, "resource": r.resource,
             "detail": r.detail, "ip_address": r.ip_address}
            for r in rows
        ],
    }
