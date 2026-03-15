"""Accept-Language middleware and helpers for localized error responses."""

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

SUPPORTED_LANGS = {"en", "de"}
DEFAULT_LANG = "en"


def parse_accept_language(header: str) -> str:
    """Parse Accept-Language header and return best supported language."""
    if not header:
        return DEFAULT_LANG
    for part in header.split(","):
        lang = part.split(";")[0].strip().lower()
        if lang[:2] in SUPPORTED_LANGS:
            return lang[:2]
    return DEFAULT_LANG


class LocaleMiddleware(BaseHTTPMiddleware):
    """Extract locale from Accept-Language header into request.state.locale."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        accept_lang = request.headers.get("accept-language", "")
        request.state.locale = parse_accept_language(accept_lang)
        return await call_next(request)


def get_locale(request: Request) -> str:
    """Get locale from request state, with fallback."""
    return getattr(request.state, "locale", DEFAULT_LANG)


def translated_error(request: Request, status_code: int, error_code: str) -> HTTPException:
    """Create an HTTPException with a localized message."""
    from app.core.errors import get_error
    lang = get_locale(request)
    return HTTPException(status_code=status_code, detail=get_error(error_code, lang))
