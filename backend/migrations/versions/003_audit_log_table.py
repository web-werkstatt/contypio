"""Add cms_audit_logs table for persistent audit trail (S10).

Revision ID: 003_audit_log
Revises: 002_security_s2
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "003_audit_log"
down_revision = "002_security_s2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "cms_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("tenant_id", sa.UUID(), nullable=True, index=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("client_ip", sa.String(45), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )


def downgrade():
    op.drop_table("cms_audit_logs")
