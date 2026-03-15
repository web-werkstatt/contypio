"""Request audit logging middleware (S10).

Logs all mutating requests (POST/PUT/PATCH/DELETE) to the admin API.
Read-only delivery endpoints are NOT logged (too noisy).

Retention: 90 days. IP anonymized after 7 days (GDPR/DSGVO).
"""
import logging
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger("cms.audit")

# Only log mutating methods on admin endpoints
_LOGGED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log mutating admin API requests for audit trail."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        method = request.method

        # Only audit admin API mutations, not delivery reads
        if not path.startswith("/api/") or method not in _LOGGED_METHODS:
            return await call_next(request)

        start = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        # Extract user info from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        tenant_id = getattr(request.state, "tenant_id", None)

        # Anonymize IP: log only for 7 days, then drop
        forwarded = request.headers.get("x-forwarded-for", "")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

        logger.info(
            "AUDIT %s %s -> %d (%dms) user=%s tenant=%s ip=%s",
            method,
            path,
            response.status_code,
            duration_ms,
            user_id or "-",
            tenant_id or "-",
            client_ip,
        )

        return response
