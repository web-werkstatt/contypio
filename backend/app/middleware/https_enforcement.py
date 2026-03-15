"""HTTPS/HSTS Enforcement Middleware (S2) — Defense-in-Depth.

Primary HTTPS enforcement is handled by Caddy reverse proxy.
This middleware acts as a fallback for direct container access or dev environments.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

from app.core.config import settings


class HTTPSEnforcementMiddleware(BaseHTTPMiddleware):
    """Enforces HTTPS and sets HSTS header. Deactivated via ENFORCE_HTTPS=false."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Detect scheme behind reverse proxy (Caddy sets X-Forwarded-Proto)
        scheme = request.headers.get("x-forwarded-proto", request.url.scheme)

        if settings.ENFORCE_HTTPS and scheme != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=301)

        response = await call_next(request)

        # HSTS only over HTTPS
        if scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
