"""add salla_order_contacts table

Revision ID: 007
Revises: 006
Create Date: 2026-03-21
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "salla_order_contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_number", sa.String(50), nullable=False, unique=True),
        sa.Column("customer_name", sa.String(200), nullable=True),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_salla_order_contacts_order_number", "salla_order_contacts", ["order_number"])


def downgrade():
    op.drop_index("ix_salla_order_contacts_order_number", "salla_order_contacts")
    op.drop_table("salla_order_contacts")
