"""make hub_audit_logs append-only via trigger (block UPDATE)

DELETE is still allowed so the retention cleanup (maintenance.py purge-audit)
can run. UPDATE is blocked to prevent in-place rewriting of history.

Revision ID: 012
Revises: 011
Create Date: 2026-04-23
"""
from alembic import op

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_hub_audit_log_update() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'hub_audit_logs is append-only; UPDATE is not allowed';
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER hub_audit_logs_no_update
        BEFORE UPDATE ON hub_audit_logs
        FOR EACH ROW EXECUTE FUNCTION prevent_hub_audit_log_update();
    """)


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS hub_audit_logs_no_update ON hub_audit_logs")
    op.execute("DROP FUNCTION IF EXISTS prevent_hub_audit_log_update()")
