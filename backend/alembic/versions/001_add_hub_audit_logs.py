"""add hub_audit_logs table

Revision ID: 001
Revises:
Create Date: 2026-03-19
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "hub_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("username", sa.String(50), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource", sa.String(100), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
    )
    op.create_index("ix_hub_audit_logs_timestamp", "hub_audit_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_hub_audit_logs_timestamp", table_name="hub_audit_logs")
    op.drop_table("hub_audit_logs")
