"""Auth helpers: password hashing, token round-trip, admin-only guard."""
import os
# Must be set BEFORE importing auth/config (they read env at import time)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only")
os.environ.setdefault("DATABASE_URL", "postgresql://x:x@localhost/x")

import pytest
from unittest.mock import MagicMock
from auth import hash_password, verify_password, create_session_token, decode_session_token


def test_password_hash_and_verify():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_session_token_round_trip():
    token = create_session_token(42)
    assert decode_session_token(token) == 42


def test_session_token_tampered_returns_none():
    token = create_session_token(1) + "tampered"
    assert decode_session_token(token) is None
