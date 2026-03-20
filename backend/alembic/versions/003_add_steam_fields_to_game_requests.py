"""add steam fields to game_requests

Revision ID: 003
Revises: 002
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("game_requests", sa.Column("steam_app_id", sa.String(20), nullable=True))
    op.add_column("game_requests", sa.Column("steam_name", sa.String(200), nullable=True))
    op.add_column("game_requests", sa.Column("steam_url", sa.String(300), nullable=True))
    op.add_column("game_requests", sa.Column("steam_price_uah", sa.Float(), nullable=True))
    op.add_column("game_requests", sa.Column("steam_price_sar", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("game_requests", "steam_price_sar")
    op.drop_column("game_requests", "steam_price_uah")
    op.drop_column("game_requests", "steam_url")
    op.drop_column("game_requests", "steam_name")
    op.drop_column("game_requests", "steam_app_id")
