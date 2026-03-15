import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UUID, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsPage(Base, TenantMixin):
    __tablename__ = "cms_pages"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_page_tenant_slug"),
        UniqueConstraint("tenant_id", "path", name="uq_page_tenant_path"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    page_type: Mapped[str] = mapped_column(String(50), default="content")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    seo: Mapped[dict] = mapped_column(JSON, default=dict)
    hero: Mapped[dict] = mapped_column(JSON, default=dict)
    sections: Mapped[list] = mapped_column(JSON, default=list)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("cms_pages.id"))
    collection_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cms_users.id"))
