"""Webhook management API - CRUD + Test endpoints."""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.webhook import CmsWebhook, CmsWebhookLog
from app.schemas.webhook import (
    WebhookCreate,
    WebhookLogResponse,
    WebhookResponse,
    WebhookUpdate,
    WebhookWithSecret,
)
from app.services.edition_gate import require_module
from app.services.webhook_service import WEBHOOK_EVENTS, dispatch_test_event

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.get("/events")
async def list_events(
    user: CmsUser = Depends(require_module("webhooks")),
) -> list[str]:
    """List all available webhook event types."""
    return WEBHOOK_EVENTS


@router.get("", response_model=list[WebhookResponse])
async def list_webhooks(
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsWebhook)
        .where(CmsWebhook.tenant_id == user.tenant_id)
        .order_by(CmsWebhook.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=WebhookWithSecret, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    data: WebhookCreate,
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    data.validate_events()
    webhook = CmsWebhook(
        tenant_id=user.tenant_id,
        name=data.name,
        url=data.url,
        secret=secrets.token_urlsafe(32),
        events=data.events,
    )
    db.add(webhook)
    await db.flush()
    await db.refresh(webhook)
    return webhook


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: str,
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    webhook = await _get_webhook(webhook_id, user.tenant_id, db)
    return webhook


@router.put("/{webhook_id}", response_model=WebhookResponse)
@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: str,
    data: WebhookUpdate,
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    webhook = await _get_webhook(webhook_id, user.tenant_id, db)
    update_data = data.model_dump(exclude_unset=True)
    if "events" in update_data:
        invalid = [e for e in update_data["events"] if e not in WEBHOOK_EVENTS]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Ungueltige Events: {', '.join(invalid)}")
    for field, value in update_data.items():
        setattr(webhook, field, value)
    await db.flush()
    await db.refresh(webhook)
    return webhook


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: str,
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    webhook = await _get_webhook(webhook_id, user.tenant_id, db)
    await db.delete(webhook)


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    """Send a test.ping event to the webhook URL."""
    webhook = await _get_webhook(webhook_id, user.tenant_id, db)
    result = await dispatch_test_event(webhook.id, db)
    return result


@router.get("/{webhook_id}/logs", response_model=list[WebhookLogResponse])
async def get_webhook_logs(
    webhook_id: str,
    limit: int = Query(20, ge=1, le=50),
    user: CmsUser = Depends(require_module("webhooks")),
    db: AsyncSession = Depends(get_db),
):
    # Verify webhook belongs to tenant
    await _get_webhook(webhook_id, user.tenant_id, db)
    result = await db.execute(
        select(CmsWebhookLog)
        .where(CmsWebhookLog.webhook_id == webhook_id)
        .order_by(CmsWebhookLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def _get_webhook(webhook_id: str, tenant_id, db: AsyncSession) -> CmsWebhook:
    """Fetch webhook by ID, ensuring it belongs to the tenant."""
    result = await db.execute(
        select(CmsWebhook)
        .where(CmsWebhook.id == webhook_id)
        .where(CmsWebhook.tenant_id == tenant_id)
    )
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook nicht gefunden")
    return webhook
