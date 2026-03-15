import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsPageVersion(Base, TenantMixin):
    """Snapshot of a page at a specific point in time.

    Created automatically on every page save. Used for audit trail,
    version comparison, and restore functionality.
    """

    __tablename__ = "cms_page_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("cms_pages.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    seo: Mapped[dict] = mapped_column(JSON, default=dict)
    hero: Mapped[dict] = mapped_column(JSON, default=dict)
    sections: Mapped[list] = mapped_column(JSON, default=list)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cms_users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
