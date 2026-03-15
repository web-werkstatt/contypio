from sqlalchemy import Boolean, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class CmsFieldTypePreset(Base, TenantMixin):
    __tablename__ = "cms_field_type_presets"
    __table_args__ = (
        UniqueConstraint("tenant_id", "type_key", name="uq_fieldpreset_tenant_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type_key: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(20), default="basic")
    render: Mapped[str] = mapped_column(String(20), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    has_options: Mapped[bool] = mapped_column(Boolean, default=False)
    has_sub_fields: Mapped[bool] = mapped_column(Boolean, default=False)
    list_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
