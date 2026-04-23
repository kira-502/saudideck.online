"""security hardening: session_version, gamecode uniqueness, FK ondelete

Revision ID: 011
Revises: 010
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    # 1. users.session_version — bumped on logout to invalidate existing tokens
    op.add_column(
        "users",
        sa.Column("session_version", sa.Integer(), nullable=False, server_default="0"),
    )

    # 2. game_codes: prevent duplicate (game_name, code) pairs
    op.create_unique_constraint(
        "uq_game_codes_game_code", "game_codes", ["game_name", "code"]
    )

    # 3. matches.salla_order_id → ON DELETE CASCADE
    op.drop_constraint("matches_salla_order_id_fkey", "matches", type_="foreignkey")
    op.create_foreign_key(
        "matches_salla_order_id_fkey",
        "matches", "salla_orders",
        ["salla_order_id"], ["id"],
        ondelete="CASCADE",
    )

    # 4. hub_audit_logs.user_id → ON DELETE SET NULL
    op.drop_constraint("hub_audit_logs_user_id_fkey", "hub_audit_logs", type_="foreignkey")
    op.create_foreign_key(
        "hub_audit_logs_user_id_fkey",
        "hub_audit_logs", "users",
        ["user_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    op.drop_constraint("hub_audit_logs_user_id_fkey", "hub_audit_logs", type_="foreignkey")
    op.create_foreign_key(
        "hub_audit_logs_user_id_fkey",
        "hub_audit_logs", "users",
        ["user_id"], ["id"],
    )

    op.drop_constraint("matches_salla_order_id_fkey", "matches", type_="foreignkey")
    op.create_foreign_key(
        "matches_salla_order_id_fkey",
        "matches", "salla_orders",
        ["salla_order_id"], ["id"],
    )

    op.drop_constraint("uq_game_codes_game_code", "game_codes", type_="unique")
    op.drop_column("users", "session_version")
