"""In-memory rate limiting for Delivery API.

Simple sliding-window counter per client (API key or IP).
Adds standard X-RateLimit-* headers to responses.
"""
import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Default: 100 requests per 60 seconds
RATE_LIMIT = 100
RATE_WINDOW = 60  # seconds

# In-memory store: client_key -> list of timestamps
_requests: dict[str, list[float]] = defaultdict(list)


def _client_key(request: Request) -> str:
    """Identify client by API key or IP address."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer cms_"):
        return f"key:{auth[7:20]}"  # Use key prefix as identifier
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"ip:{ip}"


def _cleanup(key: str, now: float) -> list[float]:
    """Remove expired timestamps and return remaining."""
    cutoff = now - RATE_WINDOW
    _requests[key] = [t for t in _requests[key] if t > cutoff]
    return _requests[key]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Add rate-limit headers to delivery API responses. Return 429 on excess."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Only rate-limit delivery endpoints
        if not path.startswith("/content/"):
            return await call_next(request)

        now = time.time()
        key = _client_key(request)
        timestamps = _cleanup(key, now)
        remaining = max(0, RATE_LIMIT - len(timestamps))
        reset_at = int(now) + RATE_WINDOW

        if remaining == 0:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "type": "https://contypio.com/errors/rate-limit-exceeded",
                    "title": "Too Many Requests",
                    "status": 429,
                    "detail": f"Rate limit of {RATE_LIMIT} requests per {RATE_WINDOW}s exceeded",
                },
                headers={
                    "Retry-After": str(RATE_WINDOW),
                    "X-RateLimit-Limit": str(RATE_LIMIT),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                    "Content-Type": "application/problem+json",
                },
            )

        # Record this request
        _requests[key].append(now)

        response = await call_next(request)

        # Add rate-limit headers
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining - 1)
        response.headers["X-RateLimit-Reset"] = str(reset_at)

        return response
