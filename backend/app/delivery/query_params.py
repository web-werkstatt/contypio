"""Reusable query parameter schemas for Delivery API.

Framework-agnostic pagination, sorting, filtering and sparse fields.
Any frontend (Astro, Next.js, Nuxt, etc.) can use these standard parameters.

Sort syntax (Strapi/Directus-compatible):
  ?sort=-title          (minus prefix = desc)
  ?sort=title:asc       (colon suffix)
  ?sort=title&order=desc (legacy, backwards compatible)

Filter syntax (bracket notation):
  ?filter[page_type]=listing
  ?filter[price][gte]=100
  ?page_type=listing    (legacy flat params, backwards compatible)

Cursor pagination (keyset):
  ?cursor=eyJpZCI6MTAwfQ&limit=20
"""
import base64
import json
import re
from dataclasses import dataclass, field

from fastapi import Query, Request


@dataclass
class PaginationParams:
    """Standard pagination: limit + offset."""
    limit: int = Query(default=20, ge=1, le=100, description="Items per page (1-100)")
    offset: int = Query(default=0, ge=0, description="Number of items to skip")


@dataclass
class SortParams:
    """Standard sorting with direction.

    Supports: ?sort=-title, ?sort=title:asc, ?sort=title&order=desc
    """
    sort: str = Query(default="sort_order", description="Sort field. Prefix with - for desc, or append :asc/:desc")
    order: str = Query(default="asc", pattern="^(asc|desc)$", description="Sort direction (fallback if not in sort param)")

    def parsed(self) -> tuple[str, str]:
        """Parse sort string into (field, direction)."""
        raw = self.sort.strip()
        if raw.startswith("-"):
            return raw[1:], "desc"
        if ":" in raw:
            parts = raw.split(":", 1)
            direction = parts[1].lower() if parts[1].lower() in ("asc", "desc") else self.order
            return parts[0], direction
        return raw, self.order


# Regex for bracket filter params: filter[field] or filter[field][op]
_FILTER_RE = re.compile(r"^filter\[(\w+)\](?:\[(\w+)\])?$")

# Supported filter operators
_FILTER_OPS = {"eq", "ne", "gt", "gte", "lt", "lte", "contains", "in"}


@dataclass
class FilterParams:
    """Parse bracket-notation filter params from request query string."""
    filters: list[tuple[str, str, str]] = field(default_factory=list)

    @classmethod
    def from_request(cls, request: Request) -> "FilterParams":
        """Extract filter[field][op]=value from query params."""
        filters: list[tuple[str, str, str]] = []
        for key, value in request.query_params.items():
            m = _FILTER_RE.match(key)
            if m:
                field_name = m.group(1)
                op = m.group(2) or "eq"
                if op in _FILTER_OPS:
                    filters.append((field_name, op, value))
        return cls(filters=filters)


@dataclass
class SparseFieldsParams:
    """Sparse fields: comma-separated list of fields to include."""
    fields: str | None = Query(default=None, description="Comma-separated fields to include")

    def field_set(self) -> set[str] | None:
        """Parse fields string into a set. Returns None if no fields specified."""
        if not self.fields:
            return None
        return {f.strip() for f in self.fields.split(",") if f.strip()}


@dataclass
class LocaleParams:
    """Optional locale parameter for content i18n."""
    locale: str | None = Query(
        default=None,
        description="BCP 47 locale (e.g. de, en, de-AT). Falls back to tenant default.",
    )


def paginated_response(
    items: list,
    total: int,
    limit: int,
    offset: int,
    next_cursor: str | None = None,
    prev_cursor: str | None = None,
) -> dict:
    """Standard paginated response envelope with optional cursor fields."""
    result = {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total,
    }
    if next_cursor is not None:
        result["next_cursor"] = next_cursor
    if prev_cursor is not None:
        result["prev_cursor"] = prev_cursor
    return result


# ---------------------------------------------------------------------------
# Cursor-based pagination (keyset)
# ---------------------------------------------------------------------------

def encode_cursor(data: dict) -> str:
    """Encode a cursor dict as URL-safe Base64 JSON."""
    return base64.urlsafe_b64encode(json.dumps(data, default=str).encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> dict | None:
    """Decode a cursor string back to a dict. Returns None on invalid input."""
    try:
        # Re-add padding
        padding = 4 - len(cursor) % 4
        if padding != 4:
            cursor += "=" * padding
        return json.loads(base64.urlsafe_b64decode(cursor))
    except (ValueError, json.JSONDecodeError):
        return None


@dataclass
class CursorParams:
    """Optional cursor-based pagination. When cursor is set, offset is ignored."""
    cursor: str | None = Query(default=None, description="Opaque cursor from previous response (overrides offset)")
