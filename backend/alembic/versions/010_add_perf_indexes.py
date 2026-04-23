"""add performance indexes on filtered/sorted columns

Revision ID: 010
Revises: 009
Create Date: 2026-04-23
"""
from alembic import op

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_game_requests_status", "game_requests", ["status"])
    op.create_index("ix_game_requests_deleted_at", "game_requests", ["deleted_at"])
    op.create_index("ix_game_codes_status", "game_codes", ["status"])
    op.create_index("ix_salla_orders_date", "salla_orders", ["date"])
    op.create_index("ix_g2g_orders_date", "g2g_orders", ["date"])
    op.create_index("ix_plati_orders_date", "plati_orders", ["date"])
    op.create_index("ix_z2u_orders_date", "z2u_orders", ["date"])


def downgrade():
    op.drop_index("ix_z2u_orders_date", "z2u_orders")
    op.drop_index("ix_plati_orders_date", "plati_orders")
    op.drop_index("ix_g2g_orders_date", "g2g_orders")
    op.drop_index("ix_salla_orders_date", "salla_orders")
    op.drop_index("ix_game_codes_status", "game_codes")
    op.drop_index("ix_game_requests_deleted_at", "game_requests")
    op.drop_index("ix_game_requests_status", "game_requests")
