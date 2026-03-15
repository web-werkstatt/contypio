import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class CmsMedia(Base, TenantMixin):
    __tablename__ = "cms_media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    alt: Mapped[str] = mapped_column(String(500), default="")
    caption: Mapped[str | None] = mapped_column(String(500))
    folder_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("cms_media_folders.id", ondelete="SET NULL"), index=True
    )
    category: Mapped[str] = mapped_column(String(50), default="general")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    sizes: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cms_users.id"))
