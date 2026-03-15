"""HTTP cache headers for Delivery API responses.

Generates ETag, Cache-Control and handles conditional requests (304 Not Modified).
CDN-ready: any edge/proxy can cache these responses.
"""
import hashlib
from datetime import datetime

from fastapi import Request
from fastapi.responses import JSONResponse, Response


def generate_etag(content: str | bytes) -> str:
    """Generate a weak ETag from content hash."""
    if isinstance(content, str):
        content = content.encode("utf-8")
    return f'W/"{hashlib.md5(content).hexdigest()}"'


def etag_from_timestamp(updated_at: datetime | None) -> str:
    """Generate ETag from a timestamp (useful for single-resource endpoints)."""
    ts = updated_at.isoformat() if updated_at else "none"
    return generate_etag(ts)


def check_not_modified(request: Request, etag: str) -> bool:
    """Check If-None-Match header against current ETag."""
    if_none_match = request.headers.get("if-none-match", "")
    return if_none_match == etag


# Cache profiles per content type
CACHE_PROFILES = {
    "page": "public, max-age=30, stale-while-revalidate=120",
    "pages": "public, max-age=30, stale-while-revalidate=120",
    "collection": "public, max-age=60, stale-while-revalidate=300",
    "globals": "public, max-age=60, stale-while-revalidate=300",
    "tree": "public, max-age=120, stale-while-revalidate=600",
}


def _format_http_date(dt: datetime) -> str:
    """Format datetime as HTTP-date (RFC 7231)."""
    from email.utils import format_datetime
    if dt.tzinfo is None:
        from datetime import timezone
        dt = dt.replace(tzinfo=timezone.utc)
    return format_datetime(dt, usegmt=True)


def check_if_modified_since(request: Request, updated_at: datetime | None) -> bool:
    """Check If-Modified-Since header. Returns True if NOT modified."""
    if not updated_at:
        return False
    ims = request.headers.get("if-modified-since", "")
    if not ims:
        return False
    try:
        from email.utils import parsedate_to_datetime
        ims_dt = parsedate_to_datetime(ims)
        if updated_at.tzinfo is None:
            from datetime import timezone
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        return updated_at <= ims_dt
    except (ValueError, TypeError):
        return False


def cached_json_response(
    data: dict | list,
    request: Request,
    content_type: str,
    updated_at: datetime | None = None,
) -> Response:
    """Build a JSON response with Cache-Control + ETag + Last-Modified headers.

    Returns 304 Not Modified if client already has current version.
    """
    import json
    content_str = json.dumps(data, default=str)
    etag = generate_etag(content_str) if not updated_at else etag_from_timestamp(updated_at)

    # 304 Not Modified: check ETag first, then If-Modified-Since
    if check_not_modified(request, etag) or check_if_modified_since(request, updated_at):
        headers = {"ETag": etag}
        if updated_at:
            headers["Last-Modified"] = _format_http_date(updated_at)
        return Response(status_code=304, headers=headers)

    cache_control = CACHE_PROFILES.get(content_type, "public, max-age=30")
    headers = {
        "Cache-Control": cache_control,
        "ETag": etag,
    }
    if updated_at:
        headers["Last-Modified"] = _format_http_date(updated_at)

    return JSONResponse(content=data, headers=headers)
