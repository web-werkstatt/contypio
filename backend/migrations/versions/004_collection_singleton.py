"""Add singleton flag to cms_collection_schemas.

Revision ID: 004_singleton
Revises: 003_audit_log
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = "004_singleton"
down_revision = "003_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cms_collection_schemas",
        sa.Column("singleton", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("cms_collection_schemas", "singleton")
