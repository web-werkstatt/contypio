"""Add i18n columns: translations on content models, locales/fallback_chain on tenants.

Revision ID: 001_i18n
Revises: None
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "001_i18n"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cms_pages", sa.Column("translations", sa.JSON(), server_default="{}"))
    op.add_column("cms_collections", sa.Column("translations", sa.JSON(), server_default="{}"))
    op.add_column("cms_globals", sa.Column("translations", sa.JSON(), server_default="{}"))
    op.add_column("cms_tenants", sa.Column("locales", sa.JSON(), server_default="[]"))
    op.add_column("cms_tenants", sa.Column("fallback_chain", sa.JSON(), server_default="{}"))


def downgrade():
    op.drop_column("cms_tenants", "fallback_chain")
    op.drop_column("cms_tenants", "locales")
    op.drop_column("cms_globals", "translations")
    op.drop_column("cms_collections", "translations")
    op.drop_column("cms_pages", "translations")
