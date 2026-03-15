"""Webhook event dispatcher - fires HTTP webhooks on content changes.

Supports HMAC-SHA256 signing, async fire-and-forget delivery,
optional retry with exponential backoff (Pro/Agency editions).
"""

import asyncio
import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.models.tenant import CmsTenant
from app.models.webhook import CmsWebhook, CmsWebhookLog
from app.services.edition_gate import has_feature

logger = logging.getLogger("cms.webhooks")

WEBHOOK_EVENTS = [
    "page.created",
    "page.updated",
    "page.published",
    "page.unpublished",
    "page.deleted",
    "collection.item_created",
    "collection.item_updated",
    "collection.item_deleted",
    "media.uploaded",
    "media.deleted",
    "global.updated",
    "test.ping",
]

RETRY_DELAYS = [5, 30, 120]  # seconds between retries


async def dispatch_event(
    event: str,
    payload: dict,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Find all active webhooks for this event and fire them (non-blocking)."""
    result = await db.execute(
        select(CmsWebhook)
        .where(CmsWebhook.tenant_id == tenant_id)
        .where(CmsWebhook.active.is_(True))
    )
    webhooks = result.scalars().all()

    for wh in webhooks:
        if event in (wh.events or []):
            # Fire-and-forget: don't block the caller
            asyncio.create_task(
                _fire_webhook(wh.id, wh.url, wh.secret, event, payload, tenant_id)
            )


async def dispatch_test_event(
    webhook_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Send a test.ping event synchronously and return the result."""
    wh = await db.get(CmsWebhook, webhook_id)
    if not wh:
        return {"success": False, "error": "Webhook nicht gefunden"}

    payload = {"message": "Test-Ping vom CMS"}
    body = _build_body("test.ping", payload)
    signature = _sign(wh.secret, body)
    headers = _build_headers("test.ping", signature)

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(wh.url, content=body, headers=headers)
        duration_ms = int((time.monotonic() - start) * 1000)
        success = 200 <= resp.status_code < 300

        # Log the result
        async with async_session() as log_db:
            log = CmsWebhookLog(
                webhook_id=webhook_id,
                event="test.ping",
                payload=payload,
                status_code=resp.status_code,
                response_body=resp.text[:1024],
                success=success,
                duration_ms=duration_ms,
            )
            log_db.add(log)
            await log_db.commit()

        return {
            "success": success,
            "status_code": resp.status_code,
            "duration_ms": duration_ms,
            "response": resp.text[:256],
        }
    except Exception as e:
        duration_ms = int((time.monotonic() - start) * 1000)
        async with async_session() as log_db:
            log = CmsWebhookLog(
                webhook_id=webhook_id,
                event="test.ping",
                payload=payload,
                status_code=None,
                response_body=str(e)[:1024],
                success=False,
                duration_ms=duration_ms,
            )
            log_db.add(log)
            await log_db.commit()

        return {"success": False, "error": str(e), "duration_ms": duration_ms}


async def _fire_webhook(
    webhook_id: uuid.UUID,
    url: str,
    secret: str,
    event: str,
    payload: dict,
    tenant_id: uuid.UUID,
) -> None:
    """Send webhook HTTP POST and log the result. Retry if edition allows."""
    body = _build_body(event, payload)
    signature = _sign(secret, body)
    headers = _build_headers(event, signature)

    # Determine if retry is available for this tenant
    can_retry = await _tenant_has_feature(tenant_id, "webhook_retry")
    can_log = await _tenant_has_feature(tenant_id, "webhook_logs")
    max_attempts = len(RETRY_DELAYS) + 1 if can_retry else 1

    for attempt in range(1, max_attempts + 1):
        start = time.monotonic()
        status_code = None
        response_body = None
        success = False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, content=body, headers=headers)
            status_code = resp.status_code
            response_body = resp.text[:1024]
            success = 200 <= resp.status_code < 300
        except Exception as e:
            response_body = str(e)[:1024]
            logger.warning("Webhook %s failed (attempt %d): %s", webhook_id, attempt, e)

        duration_ms = int((time.monotonic() - start) * 1000)

        # Log (always for test.ping, otherwise only if edition supports it)
        if can_log or event == "test.ping":
            try:
                async with async_session() as log_db:
                    log = CmsWebhookLog(
                        webhook_id=webhook_id,
                        event=event,
                        payload=payload,
                        status_code=status_code,
                        response_body=response_body,
                        success=success,
                        duration_ms=duration_ms,
                        attempt=attempt,
                    )
                    log_db.add(log)
                    await log_db.commit()
            except Exception as log_err:
                logger.error("Failed to log webhook: %s", log_err)

        if success:
            logger.info("Webhook %s delivered: %s → %d", webhook_id, event, status_code)
            return

        # Retry with backoff
        if attempt < max_attempts:
            delay = RETRY_DELAYS[attempt - 1]
            logger.info("Webhook %s retry in %ds (attempt %d/%d)", webhook_id, delay, attempt, max_attempts)
            await asyncio.sleep(delay)

    logger.warning("Webhook %s failed after %d attempts: %s", webhook_id, max_attempts, event)


async def _tenant_has_feature(tenant_id: uuid.UUID, feature: str) -> bool:
    """Check tenant edition feature (uses separate DB session)."""
    try:
        async with async_session() as db:
            tenant = await db.get(CmsTenant, tenant_id)
            edition = tenant.edition if tenant else "light"
            return has_feature(edition, feature)
    except Exception:
        return False


def _build_body(event: str, payload: dict) -> str:
    return json.dumps(
        {
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        },
        ensure_ascii=False,
    )


def _sign(secret: str, body: str) -> str:
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()


def _build_headers(event: str, signature: str) -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "X-CMS-Event": event,
        "X-CMS-Signature": f"sha256={signature}",
        "User-Agent": "Contypio-Webhooks/1.0",
    }
