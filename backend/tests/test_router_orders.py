"""Orders router: GET /orders/{type} returns paginated results."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from auth import get_current_user

client = TestClient(app, raise_server_exceptions=False)

TYPES = ["salla", "g2g", "plati", "z2u"]


def test_orders_require_auth():
    for t in TYPES:
        resp = client.get(f"/orders/{t}")
        assert resp.status_code == 401, f"Expected 401 for /orders/{t} without auth"


def test_orders_response_shape():
    fake_user = MagicMock(id=1, username="admin", role="admin")
    fake_db = MagicMock()
    fake_db.query.return_value.count.return_value = 0
    fake_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    from routers.orders import _get_db

    def override_get_current_user():
        return fake_user

    def override_get_db():
        yield fake_db

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[_get_db] = override_get_db
    try:
        resp = client.get("/orders/salla")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert "page" in data
