import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UUID, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsGlobal(Base, TenantMixin):
    __tablename__ = "cms_globals"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_global_tenant_slug"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc)
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cms_users.id"))
