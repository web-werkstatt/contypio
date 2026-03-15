"""RFC 7807 Problem Details error handler for Contypio API.

Transforms all HTTP errors into standard Problem Details format:
{
    "type": "https://contypio.com/errors/<error-type>",
    "title": "Human-readable title",
    "status": 404,
    "detail": "Specific error message"
}

Content-Type: application/problem+json
Reference: RFC 7807 (Problem Details for HTTP APIs)
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# Map status codes to RFC 7807 type slugs and titles
_STATUS_MAP: dict[int, tuple[str, str]] = {
    400: ("bad-request", "Bad Request"),
    401: ("unauthorized", "Unauthorized"),
    403: ("forbidden", "Forbidden"),
    404: ("not-found", "Not Found"),
    405: ("method-not-allowed", "Method Not Allowed"),
    409: ("conflict", "Conflict"),
    422: ("validation-error", "Validation Error"),
    429: ("rate-limit-exceeded", "Too Many Requests"),
    500: ("internal-error", "Internal Server Error"),
}


def _problem_response(status: int, detail: str, errors: list | None = None) -> JSONResponse:
    """Build a RFC 7807 Problem Details JSON response."""
    slug, title = _STATUS_MAP.get(status, ("error", "Error"))
    body: dict = {
        "type": f"https://contypio.com/errors/{slug}",
        "title": title,
        "status": status,
        "detail": detail,
    }
    if errors:
        body["errors"] = errors
    return JSONResponse(
        status_code=status,
        content=body,
        media_type="application/problem+json",
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register global exception handlers for RFC 7807 compliance."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return _problem_response(exc.status_code, detail)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = []
        for err in exc.errors():
            loc = err.get("loc", [])
            field_path = ".".join(str(p) for p in loc if p != "body")
            errors.append({
                "field": field_path,
                "message": err.get("msg", ""),
                "type": err.get("type", ""),
            })
        return _problem_response(422, "Request validation failed", errors=errors)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return _problem_response(500, "Internal server error")
