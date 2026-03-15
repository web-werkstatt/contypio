"""Tiered rate limiting for Delivery API (S7).

Sliding-window counter per client. Limits vary by key type:
  - public (no key):  100 req/min
  - live (API key):   500 req/min
  - build (API key):  2000 req/min

Adds standard X-RateLimit-* headers to responses.
"""
import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Tiered limits: (requests, window_seconds)
RATE_TIERS: dict[str, tuple[int, int]] = {
    "public": (100, 60),
    "live": (500, 60),
    "build": (2000, 60),
}

# In-memory store: client_key -> list of timestamps
_requests: dict[str, list[float]] = defaultdict(list)


def _client_key(request: Request) -> tuple[str, str]:
    """Identify client and determine rate tier.

    Returns (client_key, tier).
    Tier is determined by X-Key-Type header (set by auth middleware)
    or defaults to "public".
    """
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer cms_"):
        prefix = auth[7:20]  # Key prefix as identifier
        # Key type is resolved from DB during auth — we store it on request state
        tier = getattr(request.state, "rate_tier", "live")
        return f"key:{prefix}", tier
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"ip:{ip}", "public"


def _cleanup(key: str, now: float, window: int) -> list[float]:
    """Remove expired timestamps and return remaining."""
    cutoff = now - window
    _requests[key] = [t for t in _requests[key] if t > cutoff]
    return _requests[key]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Tiered rate-limit middleware for delivery API endpoints."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Only rate-limit delivery endpoints
        if not path.startswith("/content/"):
            return await call_next(request)

        now = time.time()
        key, tier = _client_key(request)
        limit, window = RATE_TIERS.get(tier, RATE_TIERS["public"])
        timestamps = _cleanup(key, now, window)
        remaining = max(0, limit - len(timestamps))
        reset_at = int(now) + window

        if remaining == 0:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "type": "https://contypio.com/errors/rate-limit-exceeded",
                    "title": "Too Many Requests",
                    "status": 429,
                    "detail": f"Rate limit of {limit} requests per {window}s exceeded (tier: {tier})",
                },
                headers={
                    "Retry-After": str(window),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                    "X-RateLimit-Tier": tier,
                    "Content-Type": "application/problem+json",
                },
            )

        # Record this request
        _requests[key].append(now)

        response = await call_next(request)

        # Add rate-limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining - 1)
        response.headers["X-RateLimit-Reset"] = str(reset_at)
        response.headers["X-RateLimit-Tier"] = tier

        return response
