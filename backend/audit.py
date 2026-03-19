import logging
from typing import Optional
from sqlalchemy.orm import Session
from models import HubAuditLog

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    *,
    action: str,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    resource: Optional[str] = None,
    detail: Optional[str] = None,
    ip: Optional[str] = None,
) -> None:
    """Write one row to hub_audit_logs. Never raises — errors are printed only."""
    try:
        entry = HubAuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource=resource,
            detail=detail,
            ip_address=ip,
        )
        db.add(entry)
        db.commit()
    except Exception as exc:
        logger.warning("[audit] failed to log: %s", exc)
