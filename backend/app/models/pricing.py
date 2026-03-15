"""Pricing plans - editierbar per Admin-UI."""
from sqlalchemy import Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PricingPlan(Base):
    __tablename__ = "cms_pricing_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    edition: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price_monthly: Mapped[int] = mapped_column(Integer, default=0)  # Cent
    price_yearly: Mapped[int] = mapped_column(Integer, default=0)   # Cent
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    stripe_price_id_monthly: Mapped[str | None] = mapped_column(String(255))
    stripe_price_id_yearly: Mapped[str | None] = mapped_column(String(255))
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    badge: Mapped[str | None] = mapped_column(String(50))  # z.B. "Beliebt", "Empfohlen"
    cta_label: Mapped[str | None] = mapped_column(String(100))  # z.B. "Jetzt starten"
