"""Pricing API - Admin kann Preise pflegen, oeffentlich lesbar."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.pricing import PricingPlan
from app.services.edition_gate import EDITION_LIMITS, EDITION_FEATURES, EditionFeatures

router = APIRouter(tags=["pricing"])


class PlanRead(BaseModel):
    id: int
    edition: str
    name: str
    description: str | None
    price_monthly: int
    price_yearly: int
    currency: str
    stripe_price_id_monthly: str | None
    stripe_price_id_yearly: str | None
    is_public: bool
    sort_order: int
    badge: str | None
    cta_label: str | None
    # Aus edition_gate dazugemischt
    limits: dict | None = None
    features: dict | None = None

    model_config = {"from_attributes": True}


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_monthly: int | None = None
    price_yearly: int | None = None
    currency: str | None = None
    stripe_price_id_monthly: str | None = None
    stripe_price_id_yearly: str | None = None
    is_public: bool | None = None
    sort_order: int | None = None
    badge: str | None = None
    cta_label: str | None = None


def _enrich_plan(plan: PlanRead) -> PlanRead:
    """Limits und Features aus edition_gate dazumischen."""
    lim = EDITION_LIMITS.get(plan.edition)
    if lim:
        plan.limits = {
            "max_pages": lim.max_pages, "max_media_mb": lim.max_media_mb,
            "max_users": lim.max_users, "max_spaces": lim.max_spaces, "max_sites": lim.max_sites,
        }
    feat = EDITION_FEATURES.get(plan.edition)
    if feat:
        plan.features = {f: getattr(feat, f) for f in EditionFeatures.__dataclass_fields__}
    return plan


# --- Public ---

@router.get("/api/pricing", response_model=list[PlanRead])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """Oeffentliche Preisliste (fuer Pricing-Page)."""
    result = await db.execute(
        select(PricingPlan).where(PricingPlan.is_public.is_(True)).order_by(PricingPlan.sort_order)
    )
    plans = [PlanRead.model_validate(p) for p in result.scalars().all()]
    return [_enrich_plan(p) for p in plans]


# --- Admin ---

@router.get("/api/admin/pricing", response_model=list[PlanRead])
async def list_all_plans(
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Alle Plaene inkl. nicht-oeffentliche (Admin)."""
    result = await db.execute(select(PricingPlan).order_by(PricingPlan.sort_order))
    plans = [PlanRead.model_validate(p) for p in result.scalars().all()]
    return [_enrich_plan(p) for p in plans]


@router.put("/api/admin/pricing/{plan_id}", response_model=PlanRead)
async def update_plan(
    plan_id: int,
    data: PlanUpdate,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Plan-Details bearbeiten (Preis, Name, Beschreibung, Stripe IDs)."""
    plan = await db.get(PricingPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    await db.flush()
    await db.refresh(plan)
    result = PlanRead.model_validate(plan)
    return _enrich_plan(result)
