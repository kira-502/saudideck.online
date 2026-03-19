"""Auth router: POST /login sets cookie; POST /logout clears it; GET /me returns user."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app, raise_server_exceptions=False)


def test_login_wrong_password():
    fake_user = MagicMock()
    fake_user.role = "admin"
    fake_user.password_hash = "$2b$12$invalidhash"

    fake_db = MagicMock()
    fake_db.query.return_value.filter.return_value.first.return_value = fake_user

    with patch("routers.auth.get_db", return_value=iter([fake_db])):
        resp = client.post("/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401


def test_login_non_admin_rejected():
    fake_user = MagicMock()
    fake_user.role = "employee"

    fake_db = MagicMock()
    fake_db.query.return_value.filter.return_value.first.return_value = fake_user

    with patch("routers.auth.get_db", return_value=iter([fake_db])):
        resp = client.post("/login", json={"username": "staff", "password": "any"})
    assert resp.status_code in (401, 403)


def test_me_unauthenticated_returns_401():
    """GET /me without a session cookie returns 401."""
    resp = client.get("/me")
    assert resp.status_code == 401


def test_logout_unauthenticated_returns_401():
    """POST /logout without a session cookie returns 401."""
    resp = client.post("/logout")
    assert resp.status_code == 401
