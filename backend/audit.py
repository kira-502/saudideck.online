import logging
import re
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal
from models import HubAuditLog

logger = logging.getLogger(__name__)

_PHONE_RE = re.compile(r"(?<!\d)(\d{6,})(?!\d)")


def redact_pii(text: Optional[str]) -> Optional[str]:
    """Mask long digit runs (phone numbers) to last 4 digits."""
    if not text:
        return text
    return _PHONE_RE.sub(lambda m: "*" * (len(m.group(1)) - 4) + m.group(1)[-4:], text)


def log_action(
    db: Session,  # kept for back-compat with callers; not used for the write
    *,
    action: str,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    resource: Optional[str] = None,
    detail: Optional[str] = None,
    ip: Optional[str] = None,
) -> None:
    """Write one row to hub_audit_logs in its own session so the caller's
    transaction is never implicitly committed. Never raises."""
    audit_db = SessionLocal()
    try:
        audit_db.add(HubAuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource=resource,
            detail=redact_pii(detail),
            ip_address=ip,
        ))
        audit_db.commit()
    except Exception as exc:
        logger.warning("[audit] failed to log: %s", exc)
        audit_db.rollback()
    finally:
        audit_db.close()
