import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CmsTenant(Base):
    __tablename__ = "cms_tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255))
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Branding (L11.2)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    primary_color: Mapped[str | None] = mapped_column(String(20), default="#2563eb")
    accent_color: Mapped[str | None] = mapped_column(String(20))
    favicon_url: Mapped[str | None] = mapped_column(String(500))
    industry: Mapped[str | None] = mapped_column(String(50), default="neutral")

    # Edition (light|starter|pro|agency)
    edition: Mapped[str] = mapped_column(String(50), default="light")

    # Plan / Usage-Limits (L11.7)
    plan: Mapped[str] = mapped_column(String(50), default="free")
    max_pages: Mapped[int] = mapped_column(Integer, default=50)
    max_media_mb: Mapped[int] = mapped_column(Integer, default=500)
    max_users: Mapped[int] = mapped_column(Integer, default=5)

    # i18n (G1)
    default_language: Mapped[str] = mapped_column(String(5), default="en")
    locales: Mapped[list] = mapped_column(JSON, default=list)  # ["en", "de", "de-AT"]
    fallback_chain: Mapped[dict] = mapped_column(JSON, default=dict)  # {"de-AT": ["de", "en"]}

    # Billing / Stripe (L11.7 Phase 2)
    billing_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255))
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255))
    stripe_price_id: Mapped[str | None] = mapped_column(String(255))

    # CORS (S3 Security Sprint 1)
    cors_origins: Mapped[list] = mapped_column(JSON, default=list)  # ["https://www.example.com"]
    cors_max_age: Mapped[int] = mapped_column(Integer, default=86400)  # Preflight cache seconds

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
