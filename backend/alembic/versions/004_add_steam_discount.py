"""add steam_discount to game_requests

Revision ID: 004
Revises: 003
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("game_requests", sa.Column("steam_discount", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("game_requests", "steam_discount")
