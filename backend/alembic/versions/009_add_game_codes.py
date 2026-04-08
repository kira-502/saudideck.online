"""add game_codes table

Revision ID: 009
Revises: 008
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "game_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("game_name", sa.String(200), nullable=False),
        sa.Column("code", sa.String(200), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="available"),
        sa.Column("sent_to_name", sa.String(200), nullable=True),
        sa.Column("sent_to_phone", sa.String(30), nullable=True),
        sa.Column("sent_to_order", sa.String(50), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_table("game_codes")
