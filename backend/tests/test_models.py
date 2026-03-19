"""Smoke-test: models can be reflected against the real DB without errors."""
import pytest
from sqlalchemy import inspect
from database import engine
from models import (
    User, SallaOrder, G2GOrder, PlatiOrder, Z2UOrder,
    Match, ImportLog, HubAuditLog,
)

EXPECTED_TABLES = [
    "users", "salla_orders", "g2g_orders", "plati_orders",
    "z2u_orders", "matches", "import_log",
]


@pytest.mark.parametrize("table_name", EXPECTED_TABLES)
def test_existing_table_exists(table_name):
    inspector = inspect(engine)
    assert table_name in inspector.get_table_names(), (
        f"Table '{table_name}' not found in DB — check DATABASE_URL"
    )
