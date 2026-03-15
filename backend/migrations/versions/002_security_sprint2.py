"""Security Sprint 2: key_type, rotation columns on api_keys.

Revision ID: 002_security_s2
Revises: 001_i18n
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "002_security_s2"
down_revision = "001_i18n"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cms_api_keys", sa.Column("key_type", sa.String(20), server_default="live"))
    op.add_column("cms_api_keys", sa.Column("rotated_key_hash", sa.String(64), nullable=True))
    op.add_column("cms_api_keys", sa.Column("rotation_expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("cms_api_keys", "rotation_expires_at")
    op.drop_column("cms_api_keys", "rotated_key_hash")
    op.drop_column("cms_api_keys", "key_type")
