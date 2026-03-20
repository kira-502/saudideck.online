"""simplify game request statuses

Revision ID: 005
Revises: 004
Create Date: 2026-03-20
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    # Convert old statuses to new ones
    op.execute("UPDATE game_requests SET status = 'top' WHERE status = 'has_deal'")
    op.execute("UPDATE game_requests SET status = 'done' WHERE status IN ('added', 'no_deal')")


def downgrade():
    op.execute("UPDATE game_requests SET status = 'pending' WHERE status = 'top'")
    op.execute("UPDATE game_requests SET status = 'pending' WHERE status = 'done'")
