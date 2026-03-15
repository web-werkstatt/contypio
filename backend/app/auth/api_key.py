"""API Key model and utilities for CMS delivery authentication."""

import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsApiKey(Base, TenantMixin):
    __tablename__ = "cms_api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)
    scopes: Mapped[list] = mapped_column(JSON, default=lambda: ["*"])
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key.

    Returns:
        (raw_key, key_hash, key_prefix)
    """
    raw = f"cms_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw.encode()).hexdigest()
    key_prefix = raw[:12]
    return raw, key_hash, key_prefix


def hash_api_key(raw: str) -> str:
    """Hash a raw API key for lookup."""
    return hashlib.sha256(raw.encode()).hexdigest()
