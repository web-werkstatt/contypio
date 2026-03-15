"""Request audit logging middleware (S10).

Logs all mutating requests (POST/PUT/PATCH/DELETE) to the admin API.
Persists to cms_audit_logs table. Read-only delivery endpoints are NOT logged.

Alerting: WARNING for 401/403, ERROR for 429/5xx.
Retention: 90 days (cleanup via scheduled task or DB policy).
IP anonymization after 7 days (GDPR) via scheduled task.
"""
import logging
import time
import uuid as uuid_mod

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger("cms.audit")

# Only log mutating methods on admin endpoints
_LOGGED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log mutating admin API requests to DB + structured log."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        method = request.method

        # Only audit admin API mutations, not delivery reads
        if not path.startswith("/api/") or method not in _LOGGED_METHODS:
            return await call_next(request)

        start = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        # Extract user/tenant from request state (set by auth)
        user_id = getattr(request.state, "user_id", None)
        tenant_id = getattr(request.state, "tenant_id", None)

        # Client IP
        forwarded = request.headers.get("x-forwarded-for", "")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "0.0.0.0")

        status = response.status_code

        # Alerting: log level based on status code
        if status == 401 or status == 403:
            logger.warning(
                "AUDIT %s %s -> %d (%dms) user=%s tenant=%s ip=%s",
                method, path, status, duration_ms, user_id or "-", tenant_id or "-", client_ip,
            )
        elif status == 429 or status >= 500:
            logger.error(
                "AUDIT %s %s -> %d (%dms) user=%s tenant=%s ip=%s",
                method, path, status, duration_ms, user_id or "-", tenant_id or "-", client_ip,
            )
        else:
            logger.info(
                "AUDIT %s %s -> %d (%dms) user=%s tenant=%s ip=%s",
                method, path, status, duration_ms, user_id or "-", tenant_id or "-", client_ip,
            )

        # Persist to DB (fire-and-forget, don't block response)
        try:
            await _persist_audit_log(
                tenant_id=tenant_id,
                user_id=user_id,
                method=method,
                path=path,
                status_code=status,
                duration_ms=duration_ms,
                client_ip=client_ip,
            )
        except Exception as e:
            logger.error("Failed to persist audit log: %s", e)

        return response


async def _persist_audit_log(
    tenant_id: uuid_mod.UUID | None,
    user_id: uuid_mod.UUID | None,
    method: str,
    path: str,
    status_code: int,
    duration_ms: int,
    client_ip: str,
) -> None:
    """Write audit entry to cms_audit_logs table."""
    from app.core.database import async_session
    from app.models.audit_log import CmsAuditLog

    async with async_session() as db:
        log = CmsAuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            method=method,
            path=path[:500],
            status_code=status_code,
            duration_ms=duration_ms,
            client_ip=client_ip,
        )
        db.add(log)
        await db.commit()


async def cleanup_old_audit_logs(retention_days: int = 90) -> int:
    """Delete audit logs older than retention_days. Call from scheduled task."""
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import delete

    from app.core.database import async_session
    from app.models.audit_log import CmsAuditLog

    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    async with async_session() as db:
        result = await db.execute(
            delete(CmsAuditLog).where(CmsAuditLog.created_at < cutoff)
        )
        await db.commit()
        return result.rowcount or 0


async def anonymize_old_ips(days: int = 7) -> int:
    """Anonymize IPs older than 7 days (GDPR). Call from scheduled task."""
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import update

    from app.core.database import async_session
    from app.models.audit_log import CmsAuditLog

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    async with async_session() as db:
        result = await db.execute(
            update(CmsAuditLog)
            .where(CmsAuditLog.created_at < cutoff, CmsAuditLog.client_ip != "0.0.0.0")
            .values(client_ip="0.0.0.0")
        )
        await db.commit()
        return result.rowcount or 0
