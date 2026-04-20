"""Security Response Headers Middleware (S1).

Adds OWASP-recommended security headers to every API response.
Reference: OWASP Secure Headers Project, API8:2023 Security Misconfiguration.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds path-aware security headers to API and admin responses."""

    BASE_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "X-Permitted-Cross-Domain-Policies": "none",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
    }

    API_CSP = "default-src 'none'; frame-ancestors 'none'"
    ADMIN_CSP = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "frame-ancestors 'none'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; "
        "font-src 'self' data:; "
        "connect-src 'self'; "
        "worker-src 'self' blob:"
    )

    ADMIN_PREFIXES = (
        "/assets",
        "/uploads",
        "/static",
    )

    ADMIN_FILES = {
        "/",
        "/login",
        "/onboarding",
        "/contypio-logo.svg",
        "/contypio-icon.svg",
        "/vite.svg",
        "/favicon.ico",
    }

    API_PREFIXES = (
        "/api",
        "/content",
        "/openapi.json",
        "/redoc",
        "/docs",
        "/health",
    )

    @classmethod
    def _content_security_policy(cls, request: Request, response: Response) -> str:
        path = request.url.path
        content_type = response.headers.get("content-type", "")

        is_admin_path = path in cls.ADMIN_FILES or path.startswith(cls.ADMIN_PREFIXES)
        is_html = content_type.startswith("text/html")
        is_api_path = path.startswith(cls.API_PREFIXES)

        # SPA routes like /collections or /pages/1 render index.html and need
        # self-hosted JS/CSS/assets to load. API and docs stay locked down.
        if (is_html and not is_api_path) or is_admin_path:
            return cls.ADMIN_CSP
        return cls.API_CSP

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for header, value in self.BASE_HEADERS.items():
            response.headers[header] = value
        response.headers["Content-Security-Policy"] = self._content_security_policy(request, response)
        return response
