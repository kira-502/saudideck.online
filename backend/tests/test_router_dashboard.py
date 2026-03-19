"""Dashboard /dashboard/stats returns counts for each section."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from auth import get_current_user
from routers.dashboard import _get_db

client = TestClient(app, raise_server_exceptions=False)


def test_dashboard_stats_require_auth():
    resp = client.get("/dashboard/stats")
    assert resp.status_code == 401


def test_dashboard_stats_shape():
    fake_user = MagicMock(id=1, username="admin", role="admin")

    fake_session = MagicMock()
    fake_session.query.return_value.count.return_value = 10
    fake_session.query.return_value.filter.return_value.count.return_value = 2

    def override_get_current_user():
        return fake_user

    def override_get_db():
        yield fake_session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[_get_db] = override_get_db
    try:
        resp = client.get("/dashboard/stats")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    for key in ["salla_orders", "g2g_orders", "plati_orders", "z2u_orders", "matches", "users", "imports_today"]:
        assert key in data, f"Missing key: {key}"
