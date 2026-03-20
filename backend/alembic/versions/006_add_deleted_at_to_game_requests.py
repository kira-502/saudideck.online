"""add deleted_at to game_requests

Revision ID: 006
Revises: 005
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("game_requests", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("game_requests", "deleted_at")
