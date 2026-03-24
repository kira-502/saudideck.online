"""add device_price_records table

Revision ID: 008
Revises: 007
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "device_price_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("model", sa.String(50), nullable=False),
        sa.Column("cost_aed", sa.Float(), nullable=False),
        sa.Column("aed_to_sar_rate", sa.Float(), nullable=False),
        sa.Column("cost_sar", sa.Float(), nullable=False),
        sa.Column("shipping_sar", sa.Float(), nullable=False),
        sa.Column("sale_price_cash", sa.Float(), nullable=False),
        sa.Column("sale_price_installment", sa.Float(), nullable=False),
        sa.Column("profit_cash", sa.Float(), nullable=False),
        sa.Column("profit_installment", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_table("device_price_records")
