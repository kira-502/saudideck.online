"""Users + AuditLogs routers: require auth, return correct shapes."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from auth import get_current_user

client = TestClient(app, raise_server_exceptions=False)


def test_users_require_auth():
    resp = client.get("/users")
    assert resp.status_code == 401


def test_users_returns_list():
    fake_user = MagicMock(id=1, username="admin", role="admin")
    fake_db = MagicMock()
    fake_db.query.return_value.order_by.return_value.all.return_value = []

    from routers.users import _get_db

    def override_get_current_user():
        return fake_user

    def override_get_db():
        yield fake_db

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[_get_db] = override_get_db
    try:
        resp = client.get("/users")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_audit_logs_require_auth():
    resp = client.get("/audit-logs")
    assert resp.status_code == 401


def test_audit_logs_returns_paginated():
    fake_user = MagicMock(id=1, username="admin", role="admin")
    fake_db = MagicMock()
    fake_db.query.return_value.count.return_value = 0
    fake_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    from routers.audit_logs import _get_db

    def override_get_current_user():
        return fake_user

    def override_get_db():
        yield fake_db

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[_get_db] = override_get_db
    try:
        resp = client.get("/audit-logs")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
