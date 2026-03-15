from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsCollectionSchema(Base, TenantMixin):
    __tablename__ = "cms_collection_schemas"
    __table_args__ = (
        UniqueConstraint("tenant_id", "collection_key", name="uq_colschema_tenant_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_key: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    label_singular: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="Database")
    fields: Mapped[list] = mapped_column(JSON, default=list)
    slug_field: Mapped[str | None] = mapped_column(String(100))
    title_field: Mapped[str] = mapped_column(String(100), default="title")
    sort_field: Mapped[str] = mapped_column(String(100), default="sort_order")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class CmsCollection(Base, TenantMixin):
    __tablename__ = "cms_collections"
    __table_args__ = (
        UniqueConstraint("tenant_id", "collection_key", "slug", name="uq_col_tenant_key_slug"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collection_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="published")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    image_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("cms_media.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc)
    )
    translations: Mapped[dict] = mapped_column(JSON, default=dict)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
