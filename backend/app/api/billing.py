"""Billing API endpoints (nur aktiv wenn Stripe konfiguriert + billing_enabled)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.tenant import CmsTenant
from app.services.billing_service import (
    PLAN_LIMITS,
    create_checkout_session,
    create_portal_session,
    handle_webhook_event,
    is_stripe_configured,
)

router = APIRouter(prefix="/api/billing", tags=["billing"])


class CheckoutRequest(BaseModel):
    price_id: str


@router.get("/status")
async def billing_status(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Billing-Status: Ist Stripe konfiguriert? Ist Billing aktiv?"""
    tenant = await db.get(CmsTenant, user.tenant_id)
    return {
        "stripe_configured": is_stripe_configured(),
        "billing_enabled": tenant.billing_enabled if tenant else False,
        "plan": tenant.plan if tenant else "free",
        "has_subscription": bool(tenant and tenant.stripe_subscription_id),
        "plans": PLAN_LIMITS,
    }


@router.post("/checkout")
async def create_checkout(
    data: CheckoutRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stripe Checkout Session erstellen (leitet zu Stripe weiter)."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant or not tenant.billing_enabled:
        raise HTTPException(status_code=403, detail="Billing ist nicht aktiviert")
    try:
        url = await create_checkout_session(user.tenant_id, data.price_id, db)
        return {"checkout_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/portal")
async def customer_portal(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stripe Customer Portal (Abo verwalten, Rechnungen, Zahlungsmethode)."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant or not tenant.billing_enabled:
        raise HTTPException(status_code=403, detail="Billing ist nicht aktiviert")
    try:
        url = await create_portal_session(user.tenant_id, db)
        return {"portal_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/toggle")
async def toggle_billing(
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Billing fuer den Tenant ein-/ausschalten (nur Admin)."""
    if not is_stripe_configured():
        raise HTTPException(status_code=400, detail="Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)")
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant nicht gefunden")
    tenant.billing_enabled = not tenant.billing_enabled
    await db.flush()
    await db.refresh(tenant)
    return {"billing_enabled": tenant.billing_enabled}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Stripe Webhook Endpoint (kein Auth, verifiziert per Signature)."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event_type = await handle_webhook_event(payload, sig, db)
        return {"received": True, "type": event_type}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
