"""Audit helper writes a row to hub_audit_logs."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")

import pytest
from unittest.mock import MagicMock
from audit import log_action


def test_log_action_inserts_row():
    db = MagicMock()
    log_action(db, user_id=1, username="admin", action="view_orders",
               resource="salla_orders", detail="page=1", ip="1.2.3.4")
    db.add.assert_called_once()
    db.commit.assert_called_once()
    row = db.add.call_args[0][0]
    assert row.action == "view_orders"
    assert row.resource == "salla_orders"
    assert row.username == "admin"
    assert row.ip_address == "1.2.3.4"
