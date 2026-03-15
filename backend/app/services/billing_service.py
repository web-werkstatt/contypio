"""Stripe billing integration (modular, nur aktiv wenn konfiguriert).

Aktivierung:
1. STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in .env setzen
2. billing_enabled=True auf dem Tenant setzen (Admin-UI)
3. Stripe Products/Prices im Stripe Dashboard anlegen
"""
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.tenant import CmsTenant

logger = logging.getLogger("cms.billing")

# Plan-Limits sind jetzt in edition_gate.py definiert (EDITION_LIMITS)
# Hier nur fuer Rueckwaertskompatibilitaet des /api/billing/status Endpoints
from app.services.edition_gate import EDITION_LIMITS, get_limits

PLAN_LIMITS: dict[str, dict[str, int]] = {
    name: {
        "max_pages": lim.max_pages,
        "max_media_mb": lim.max_media_mb,
        "max_users": lim.max_users,
    }
    for name, lim in EDITION_LIMITS.items()
}


def is_stripe_configured() -> bool:
    """Check if Stripe keys are set."""
    return bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_WEBHOOK_SECRET)


def _get_stripe():
    """Lazy-import stripe to avoid errors when not installed/configured."""
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


async def create_checkout_session(
    tenant_id: uuid.UUID, price_id: str, db: AsyncSession
) -> str:
    """Create a Stripe Checkout Session. Returns the checkout URL."""
    if not is_stripe_configured():
        raise ValueError("Stripe ist nicht konfiguriert")

    stripe = _get_stripe()
    tenant = await db.get(CmsTenant, tenant_id)
    if not tenant:
        raise ValueError("Tenant nicht gefunden")

    # Create or reuse Stripe customer
    if not tenant.stripe_customer_id:
        customer = stripe.Customer.create(
            name=tenant.name,
            metadata={"tenant_id": str(tenant.id), "tenant_slug": tenant.slug},
        )
        tenant.stripe_customer_id = customer.id
        await db.flush()

    session = stripe.checkout.Session.create(
        customer=tenant.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.CORS_ORIGINS[0]}/profile?billing=success",
        cancel_url=f"{settings.CORS_ORIGINS[0]}/profile?billing=cancel",
        metadata={"tenant_id": str(tenant.id)},
    )
    return session.url


async def create_portal_session(tenant_id: uuid.UUID, db: AsyncSession) -> str:
    """Create a Stripe Customer Portal Session. Returns the portal URL."""
    if not is_stripe_configured():
        raise ValueError("Stripe ist nicht konfiguriert")

    stripe = _get_stripe()
    tenant = await db.get(CmsTenant, tenant_id)
    if not tenant or not tenant.stripe_customer_id:
        raise ValueError("Kein Stripe-Kunde vorhanden")

    session = stripe.billing_portal.Session.create(
        customer=tenant.stripe_customer_id,
        return_url=f"{settings.CORS_ORIGINS[0]}/profile",
    )
    return session.url


async def handle_webhook_event(payload: bytes, sig_header: str, db: AsyncSession) -> str:
    """Process a Stripe webhook event. Returns event type."""
    if not is_stripe_configured():
        raise ValueError("Stripe ist nicht konfiguriert")

    stripe = _get_stripe()
    event = stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )

    if event.type == "checkout.session.completed":
        session = event.data.object
        tenant_id = session.metadata.get("tenant_id")
        if tenant_id:
            result = await db.execute(
                select(CmsTenant).where(CmsTenant.id == tenant_id)
            )
            tenant = result.scalar_one_or_none()
            if tenant:
                tenant.stripe_subscription_id = session.subscription
                await db.flush()
                logger.info("Checkout completed for tenant %s", tenant.slug)

    elif event.type in ("customer.subscription.updated", "customer.subscription.deleted"):
        subscription = event.data.object
        result = await db.execute(
            select(CmsTenant).where(CmsTenant.stripe_customer_id == subscription.customer)
        )
        tenant = result.scalar_one_or_none()
        if tenant:
            if event.type == "customer.subscription.deleted":
                tenant.edition = "light"
                tenant.plan = "free"
                tenant.stripe_subscription_id = None
                tenant.stripe_price_id = None
            else:
                # Map price to edition via Stripe Product metadata
                price_id = subscription.items.data[0].price.id if subscription.items.data else None
                tenant.stripe_price_id = price_id
                product_id = subscription.items.data[0].price.product if subscription.items.data else None
                if product_id:
                    product = stripe.Product.retrieve(product_id)
                    edition_name = product.metadata.get("edition", "starter")
                else:
                    edition_name = "starter"
                tenant.edition = edition_name
                tenant.plan = edition_name

            # Update limits from edition gate
            limits = get_limits(tenant.edition)
            tenant.max_pages = limits.max_pages
            tenant.max_media_mb = limits.max_media_mb
            tenant.max_users = limits.max_users
            await db.flush()
            logger.info("Subscription %s for tenant %s -> plan=%s", event.type, tenant.slug, tenant.plan)

    elif event.type == "invoice.payment_failed":
        invoice = event.data.object
        logger.warning("Payment failed for customer %s", invoice.customer)

    return event.type
