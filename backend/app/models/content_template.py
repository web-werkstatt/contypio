"""Content Template model for reusable marketing content."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsContentTemplate(TenantMixin, Base):
    __tablename__ = "cms_content_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    service_key: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    service_name: Mapped[str] = mapped_column(String(100), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # CT2-ready: KI-Generierung
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    prompt_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    style_guide: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
