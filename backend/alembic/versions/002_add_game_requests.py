"""add game_requests table

Revision ID: 002
Revises: 001
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "game_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("game_name", sa.String(200), nullable=False),
        sa.Column("order_number", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_game_requests_created_at", "game_requests", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_game_requests_created_at", table_name="game_requests")
    op.drop_table("game_requests")
