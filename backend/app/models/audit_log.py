"""Audit log model for tracking admin API mutations (S10)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CmsAuditLog(Base):
    __tablename__ = "cms_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    client_ip: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv6 max
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True,
    )
