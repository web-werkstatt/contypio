"""Tenant-aware CORS Middleware (S3).

Loads allowed origins per tenant from DB. Default: deny all.
Replaces FastAPI's built-in CORSMiddleware for tenant-specific CORS control.
Reference: API8:2023 Security Misconfiguration.
"""

from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send

from sqlalchemy import select
from app.core.database import async_session
from app.models.tenant import CmsTenant
from app.core.config import settings


async def _resolve_tenant_cors(request: Request) -> tuple[list[str], int]:
    """Resolve CORS origins and max_age for the request's tenant.

    Resolution order: X-Tenant header -> Host header -> default tenant.
    Returns (cors_origins, cors_max_age).
    """
    tenant_hint = request.headers.get("x-tenant") or request.headers.get("host", "").split(":")[0]

    async with async_session() as db:
        # Try by slug or domain
        result = await db.execute(
            select(CmsTenant).where(
                (CmsTenant.slug == tenant_hint) | (CmsTenant.domain == tenant_hint)
            )
        )
        tenant = result.scalar_one_or_none()

        # Fallback to default tenant
        if not tenant:
            result = await db.execute(
                select(CmsTenant).where(CmsTenant.slug == settings.DEFAULT_TENANT_SLUG)
            )
            tenant = result.scalar_one_or_none()

    if not tenant:
        return [], 86400

    return tenant.cors_origins or [], tenant.cors_max_age or 86400


class TenantAwareCORSMiddleware:
    """CORS middleware that loads origins per tenant from DB.

    Default: deny all (no origins configured = no CORS headers).
    Server-to-server requests (no Origin header) pass through unaffected.
    """

    ALLOWED_METHODS = "GET, POST, OPTIONS"
    ALLOWED_HEADERS = "Authorization, Content-Type, Accept, Accept-Language, X-Tenant"

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        origin = request.headers.get("origin")

        if not origin:
            # No Origin = no CORS needed (server-to-server)
            await self.app(scope, receive, send)
            return

        allowed_origins, cors_max_age = await _resolve_tenant_cors(request)

        if origin not in allowed_origins:
            # Origin not allowed — process request but without CORS headers
            # (browser will block the response)
            await self.app(scope, receive, send)
            return

        # Preflight (OPTIONS)
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = self.ALLOWED_METHODS
            response.headers["Access-Control-Allow-Headers"] = self.ALLOWED_HEADERS
            response.headers["Access-Control-Max-Age"] = str(cors_max_age)
            response.headers["Vary"] = "Origin"
            await response(scope, receive, send)
            return

        # Normal request — inject CORS headers into response
        async def send_with_cors(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"access-control-allow-origin", origin.encode()))
                headers.append((b"vary", b"Origin"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_cors)
