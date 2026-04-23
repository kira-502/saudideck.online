"""Scheduled maintenance tasks. Runnable via CLI:

    python -m maintenance purge-contacts [--days 365]
    python -m maintenance purge-audit    [--days 730]

Designed to be called from cron.
"""
import argparse
import logging
import sys
from datetime import datetime, timedelta, timezone

from database import SessionLocal
import models

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("maintenance")


def purge_old_salla_contacts(days: int = 365) -> int:
    """Delete SallaOrderContact rows older than `days`. Returns deleted count."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    db = SessionLocal()
    try:
        n = db.query(models.SallaOrderContact).filter(
            models.SallaOrderContact.uploaded_at < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        log.info("purged %d salla contacts older than %d days", n, days)
        return n
    finally:
        db.close()


def purge_old_audit_logs(days: int = 730) -> int:
    """Delete hub_audit_logs rows older than `days`. Default keeps 2 years."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    db = SessionLocal()
    try:
        n = db.query(models.HubAuditLog).filter(
            models.HubAuditLog.timestamp < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        log.info("purged %d audit logs older than %d days", n, days)
        return n
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Hub maintenance tasks")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_contacts = sub.add_parser("purge-contacts", help="Delete old Salla contacts")
    p_contacts.add_argument("--days", type=int, default=365)

    p_audit = sub.add_parser("purge-audit", help="Delete old audit log rows")
    p_audit.add_argument("--days", type=int, default=730)

    args = parser.parse_args()

    if args.cmd == "purge-contacts":
        purge_old_salla_contacts(args.days)
    elif args.cmd == "purge-audit":
        purge_old_audit_logs(args.days)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
