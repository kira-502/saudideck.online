"""Audit helper writes a row to hub_audit_logs in its own session."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")

from unittest.mock import MagicMock, patch
from audit import log_action, redact_pii


def test_log_action_inserts_row_in_own_session():
    audit_db = MagicMock()
    caller_db = MagicMock()
    with patch("audit.SessionLocal", return_value=audit_db):
        log_action(caller_db, user_id=1, username="admin", action="view_orders",
                   resource="salla_orders", detail="page=1", ip="1.2.3.4")
    # Caller's session must not be touched.
    caller_db.add.assert_not_called()
    caller_db.commit.assert_not_called()
    # Audit session gets the row and commits.
    audit_db.add.assert_called_once()
    audit_db.commit.assert_called_once()
    audit_db.close.assert_called_once()
    row = audit_db.add.call_args[0][0]
    assert row.action == "view_orders"
    assert row.resource == "salla_orders"
    assert row.username == "admin"
    assert row.ip_address == "1.2.3.4"


def test_redact_pii_masks_phone_numbers():
    assert redact_pii("phone=966503505084 name=Mohammed") == "phone=********5084 name=Mohammed"
    assert redact_pii(None) is None
    assert redact_pii("") == ""
    assert redact_pii("no digits") == "no digits"
