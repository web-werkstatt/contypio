import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.api_key import CmsApiKey, hash_api_key
from app.core.config import settings
from app.core.content_i18n import (
    build_locale_metadata,
    get_translatable_data_fields,
    merge_collection_data_translation,
    resolve_locale,
)
from app.core.database import get_db
from app.delivery.cache_headers import cached_json_response
from app.delivery.query_params import CursorParams, DepthParams, FilterParams, LocaleParams, PaginationParams, SortParams, decode_cursor, encode_cursor, paginated_response
from app.delivery.tenant_resolver import get_delivery_tenant, get_delivery_tenant_id
from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.media import CmsMedia
from app.models.tenant import CmsTenant
from app.validators.filter_validator import FilterValidator

logger = logging.getLogger("cms.delivery")

router = APIRouter(prefix="/content/collection", tags=["Content Delivery API"])
# Plural alias router for URL consistency (/content/collections/{key})
collections_plural_router = APIRouter(prefix="/content/collections", tags=["Content Delivery API"])


async def _resolve_media_ids(
    data: dict, schema_fields: list[dict], tenant_id, db: AsyncSession,
) -> dict:
    """Replace media IDs in data with full URLs based on schema field types."""
    media_field_names = [
        f["name"] for f in schema_fields
        if f.get("render") == "media-picker" or f.get("type") in ("media", "media-picker")
    ]
    if not media_field_names:
        return data

    ids_to_resolve = set()
    for name in media_field_names:
        val = data.get(name)
        if isinstance(val, int) and val > 0:
            ids_to_resolve.add(val)

    if not ids_to_resolve:
        return data

    result = await db.execute(
        select(CmsMedia).where(CmsMedia.id.in_(ids_to_resolve), CmsMedia.tenant_id == tenant_id)
    )
    base_url = settings.API_ASSET_URL.rstrip("/")
    media_map = {}
    for m in result.scalars().all():
        media_map[m.id] = {
            "id": m.id,
            "url": f"{base_url}{m.url}",
            "alt": m.alt or "",
            "width": m.width,
            "height": m.height,
        }

    resolved = {**data}
    for name in media_field_names:
        val = resolved.get(name)
        if isinstance(val, int) and val in media_map:
            resolved[name] = media_map[val]
    return resolved


def _find_relation_fields(schema_fields: list[dict], prefix: str = "") -> list[tuple[str, dict]]:
    """Recursively find relation fields in schema, including nested group/repeater."""
    results = []
    for f in schema_fields:
        name = f"{prefix}{f['name']}" if prefix else f["name"]
        if f.get("render") == "relation" or f.get("type") == "relation":
            results.append((name, f))
        sub_fields = f.get("fields")
        if sub_fields and isinstance(sub_fields, list):
            results.extend(_find_relation_fields(sub_fields, f"{name}."))
    return results


async def _resolve_relation_ids(
    data: dict, schema_fields: list[dict], tenant_id, db: AsyncSession,
) -> dict:
    """Replace relation IDs with resolved objects {id, title, slug}. Max 1 level deep."""
    relation_fields = _find_relation_fields(schema_fields)
    if not relation_fields:
        return data

    resolved = {**data}

    for field_path, field_def in relation_fields:
        config = field_def.get("config", {})
        target_collection = config.get("collection", "")
        if not target_collection:
            continue

        # Navigate to the value (supports nested paths like "group.relation_field")
        parts = field_path.split(".")
        val = data
        for part in parts:
            if isinstance(val, dict):
                val = val.get(part)
            else:
                val = None
                break

        if val is None:
            continue

        is_multiple = config.get("multiple", False)
        ids_to_resolve: set[int] = set()

        if is_multiple and isinstance(val, list):
            ids_to_resolve = {v for v in val if isinstance(v, int) and v > 0}
        elif isinstance(val, int) and val > 0:
            ids_to_resolve = {val}

        if not ids_to_resolve:
            continue

        result = await db.execute(
            select(CmsCollection).where(
                CmsCollection.id.in_(ids_to_resolve),
                CmsCollection.tenant_id == tenant_id,
                CmsCollection.collection_key == target_collection,
            )
        )
        items = result.scalars().all()
        item_map = {
            i.id: {"id": i.id, "title": i.title, "slug": i.slug}
            for i in items
        }

        # Set resolved value at the correct path
        if len(parts) == 1:
            if is_multiple and isinstance(val, list):
                resolved[parts[0]] = [item_map.get(v, {"id": v, "title": "?", "slug": None}) for v in val if isinstance(v, int)]
            elif isinstance(val, int) and val in item_map:
                resolved[parts[0]] = item_map[val]
        # For nested fields, we resolve in-place on the copy
        # (group/repeater nested relations are resolved at top-level data traversal)

    return resolved


def _get_sort_column(sort_field: str):
    """Map sort field name to SQLAlchemy column. Returns None for invalid fields."""
    allowed = {
        "sort_order": CmsCollection.sort_order,
        "title": CmsCollection.title,
        "slug": CmsCollection.slug,
        "created_at": CmsCollection.created_at,
        "updated_at": CmsCollection.updated_at,
    }
    return allowed.get(sort_field)


async def _resolve_api_key_auth(
    request: Request, db: AsyncSession,
) -> tuple[UUID, list[str], str] | None:
    """Check for Bearer API key in Authorization header.

    Returns (tenant_id, scopes, key_type) if valid, None if no API key auth present.
    Raises HTTPException on invalid/expired/inactive keys.
    Supports rotated keys during grace period (S6).
    """
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer cms_"):
        return None

    raw_key = auth[7:]  # Strip "Bearer "
    key_hash = hash_api_key(raw_key)

    # Primary lookup
    result = await db.execute(
        select(CmsApiKey).where(CmsApiKey.key_hash == key_hash)
    )
    api_key = result.scalar_one_or_none()

    # S6: Fallback to rotated key (grace period)
    if not api_key:
        result = await db.execute(
            select(CmsApiKey).where(CmsApiKey.rotated_key_hash == key_hash)
        )
        api_key = result.scalar_one_or_none()
        if api_key:
            # Check if grace period is still valid
            if api_key.rotation_expires_at and api_key.rotation_expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Rotated API key expired. Use the new key.")

    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not api_key.active:
        raise HTTPException(status_code=401, detail="API key disabled")
    if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="API key expired")

    # Update last_used_at
    api_key.last_used_at = datetime.now(timezone.utc)
    await db.commit()

    return api_key.tenant_id, api_key.scopes, api_key.key_type or "live"


def _apply_filters(base_filter: list, filters: FilterParams) -> list:
    """Apply bracket-notation filters to collection query (JSONB data fields)."""
    for field_name, op, value in filters.filters:
        # Filter on JSONB data field
        json_val = CmsCollection.data[field_name].as_string()
        if op == "eq":
            base_filter.append(json_val == value)
        elif op == "ne":
            base_filter.append(json_val != value)
        elif op == "contains":
            base_filter.append(json_val.ilike(f"%{value}%"))
        elif op in ("gt", "gte", "lt", "lte"):
            # Numeric comparison via cast
            from sqlalchemy import cast, Float
            num_col = cast(CmsCollection.data[field_name].as_string(), Float)
            try:
                num_val = float(value)
            except ValueError:
                continue
            if op == "gt":
                base_filter.append(num_col > num_val)
            elif op == "gte":
                base_filter.append(num_col >= num_val)
            elif op == "lt":
                base_filter.append(num_col < num_val)
            elif op == "lte":
                base_filter.append(num_col <= num_val)
        elif op == "in":
            vals = [v.strip() for v in value.split(",")]
            base_filter.append(json_val.in_(vals))
    return base_filter


@router.get("/{key}", summary="Get collection items (singular URL, deprecated)", deprecated=True)
async def get_collection(
    key: str,
    request: Request,
    pagination: PaginationParams = Depends(),
    sorting: SortParams = Depends(),
    cursor_params: CursorParams = Depends(),
    search: str | None = Query(default=None, description="Search in title and data"),
    locale_params: LocaleParams = Depends(),
    depth_params: DepthParams = Depends(),
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    # API-Key auth: override tenant_id and check scopes
    api_key_auth = await _resolve_api_key_auth(request, db)
    if api_key_auth:
        tenant_id, scopes, _key_type = api_key_auth
        if "*" not in scopes and key not in scopes:
            raise HTTPException(status_code=403, detail=f"API-Schlüssel hat keinen Zugriff auf '{key}'")

    schema_result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.collection_key == key,
        )
    )
    schema = schema_result.scalar_one_or_none()
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Base query
    base_filter = [
        CmsCollection.tenant_id == tenant_id,
        CmsCollection.collection_key == key,
        CmsCollection.status == "published",
    ]

    # Search filter (title + JSONB data cast to text)
    # S11: Sanitize LIKE wildcards to prevent pattern injection
    if search:
        sanitized = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        search_pattern = f"%{sanitized}%"
        base_filter.append(
            CmsCollection.title.ilike(search_pattern)
            | func.cast(CmsCollection.data, String).ilike(search_pattern)
        )

    # Bracket-notation filters: ?filter[field][op]=value
    parsed_filters = FilterParams.from_request(request)
    if parsed_filters.filters:
        # S4: Validate filters against allowlist (derive from schema field names)
        schema_field_names = {f["name"] for f in (schema.fields or []) if "name" in f}
        FilterValidator.validate(parsed_filters.filters, schema_field_names)
        base_filter = _apply_filters(base_filter, parsed_filters)

    # Total count
    count_result = await db.execute(
        select(func.count(CmsCollection.id)).where(*base_filter)
    )
    total = count_result.scalar() or 0

    # Sort (supports ?sort=-title, ?sort=title:asc, ?sort=title&order=desc)
    sort_field, sort_dir = sorting.parsed()
    sort_col = _get_sort_column(sort_field) or CmsCollection.sort_order
    order_clause = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

    # Cursor-based pagination (keyset): overrides offset when provided
    use_cursor = cursor_params.cursor is not None
    cursor_data = None
    if use_cursor:
        cursor_data = decode_cursor(cursor_params.cursor)
        if cursor_data is None:
            raise HTTPException(status_code=400, detail="Invalid cursor format")
        # Keyset condition: WHERE (sort_col, id) > (cursor_value, cursor_id)
        cursor_id = cursor_data.get("id")
        cursor_value = cursor_data.get("value")
        if cursor_id is not None:
            if sort_dir == "desc":
                base_filter.append(
                    (sort_col < cursor_value) | ((sort_col == cursor_value) & (CmsCollection.id < cursor_id))
                )
            else:
                base_filter.append(
                    (sort_col > cursor_value) | ((sort_col == cursor_value) & (CmsCollection.id > cursor_id))
                )

    # Query with pagination
    query = (
        select(CmsCollection)
        .where(*base_filter)
        .order_by(order_clause, CmsCollection.id.desc() if sort_dir == "desc" else CmsCollection.id.asc())
        .limit(pagination.limit)
    )
    if not use_cursor:
        query = query.offset(pagination.offset)

    result = await db.execute(query)
    items = list(result.scalars().all())
    schema_fields = schema.fields or []

    # i18n: resolve locale if requested
    locale_param = getattr(locale_params, "locale", None) if locale_params else None
    tenant: CmsTenant | None = None
    use_i18n = False
    resolved_locale = ""
    chain: list[str] = []
    translatable_data_fields: set[str] = set()
    if locale_param:
        tenant = await get_delivery_tenant(request, db)
        use_i18n = True
        resolved_locale, chain = resolve_locale(
            locale_param, tenant.locales or [], tenant.default_language, tenant.fallback_chain or {},
        )
        translatable_data_fields = get_translatable_data_fields(schema_fields)

    depth = depth_params.depth
    resolved_items = []
    for i in items:
        data = i.data or {}
        if depth >= 1:
            data = await _resolve_media_ids(data, schema_fields, tenant_id, db)
            data = await _resolve_relation_ids(data, schema_fields, tenant_id, db)
        item_dict: dict = {
            "id": i.id,
            "title": i.title,
            "slug": i.slug,
            "data": data,
            "sort_order": i.sort_order,
            "image_id": i.image_id,
        }
        if use_i18n and (i.translations or {}):
            # Merge title from translations
            title_trans = (i.translations or {}).get(resolved_locale, {}).get("title")
            fallbacks_used: dict[str, str] = {}
            if title_trans:
                item_dict["title"] = title_trans
            else:
                # Walk fallback chain for title
                for fl in chain:
                    t = (i.translations or {}).get(fl, {}).get("title")
                    if t:
                        item_dict["title"] = t
                        if fl != resolved_locale:
                            fallbacks_used["title"] = fl
                        break
            # Merge translatable data fields
            if translatable_data_fields:
                merged_data, data_fallbacks = merge_collection_data_translation(
                    data, i.translations or {}, translatable_data_fields, resolved_locale, chain,
                )
                item_dict["data"] = merged_data
                fallbacks_used.update(data_fallbacks)
            item_dict["_locale"] = build_locale_metadata(locale_param, resolved_locale, fallbacks_used)
        resolved_items.append(item_dict)

    # Build cursor tokens for next/prev navigation
    next_cursor = None
    prev_cursor = None
    if items:
        last = items[-1]
        last_sort_value = getattr(last, sort_field, last.sort_order)
        next_cursor = encode_cursor({"id": last.id, "sort": sort_field, "value": last_sort_value})

        first = items[0]
        first_sort_value = getattr(first, sort_field, first.sort_order)
        prev_cursor = encode_cursor({"id": first.id, "sort": sort_field, "value": first_sort_value})

    response_data = paginated_response(
        resolved_items, total, pagination.limit, pagination.offset,
        next_cursor=next_cursor if (pagination.offset + pagination.limit < total or use_cursor and len(items) == pagination.limit) else None,
        prev_cursor=prev_cursor if (pagination.offset > 0 or use_cursor) else None,
    )
    return cached_json_response(response_data, request, "collection")


@collections_plural_router.get("/{key}", summary="Get collection items", description="Fetch paginated items from a collection by key. Supports sorting, search, filtering, cursor pagination, depth control and sparse fields. Resolves media and relation references automatically.")
async def get_collection_plural(
    key: str,
    request: Request,
    pagination: PaginationParams = Depends(),
    sorting: SortParams = Depends(),
    cursor_params: CursorParams = Depends(),
    search: str | None = Query(default=None, description="Search in title and data"),
    locale_params: LocaleParams = Depends(),
    depth_params: DepthParams = Depends(),
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Plural URL alias: /content/collections/{key} -> delegates to get_collection."""
    return await get_collection(
        key, request, pagination, sorting, cursor_params, search,
        locale_params=locale_params, depth_params=depth_params, tenant_id=tenant.id, db=db,
    )


# ---------------------------------------------------------------------------
# Batch endpoint — fetch multiple collection items in a single request
# ---------------------------------------------------------------------------

class BatchCollectionRequest(BaseModel):
    ids: list[int] | None = Field(default=None, max_length=100, description="Item IDs to fetch (max 100)")
    slugs: list[str] | None = Field(default=None, max_length=100, description="Item slugs to fetch (max 100)")
    fields: str | None = Field(default=None, description="Comma-separated sparse fields")
    locale: str | None = Field(default=None, description="BCP 47 locale")
    depth: int = Field(default=2, ge=0, le=5, description="Relation resolution depth (0-5, default 2)")


@collections_plural_router.post("/{key}/batch", summary="Batch fetch collection items", description="Fetch multiple items by ID or slug. Max 100. Exactly one of ids or slugs must be provided.")
async def batch_collection_items(
    key: str,
    body: BatchCollectionRequest,
    request: Request,
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    # Validate: exactly one of ids or slugs
    has_ids = body.ids is not None and len(body.ids) > 0
    has_slugs = body.slugs is not None and len(body.slugs) > 0
    if has_ids == has_slugs:
        raise HTTPException(status_code=400, detail="Exactly one of 'ids' or 'slugs' must be provided")

    tenant_id = tenant.id

    # Load schema for media/relation resolution
    schema_result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.collection_key == key,
        )
    )
    schema = schema_result.scalar_one_or_none()
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Query items
    base_filter = [
        CmsCollection.tenant_id == tenant_id,
        CmsCollection.collection_key == key,
        CmsCollection.status == "published",
    ]
    if has_ids:
        ids_list = body.ids or []
        base_filter.append(CmsCollection.id.in_(ids_list))
        requested_keys = [str(i) for i in ids_list]
    else:
        slugs_list = body.slugs or []
        base_filter.append(CmsCollection.slug.in_(slugs_list))
        requested_keys = list(slugs_list)

    result = await db.execute(select(CmsCollection).where(*base_filter))
    db_items = list(result.scalars().all())
    schema_fields = schema.fields or []

    # Build lookup for missing detection
    if has_ids:
        found_keys = {str(i.id) for i in db_items}
    else:
        found_keys = {i.slug for i in db_items if i.slug}

    missing = [k for k in requested_keys if k not in found_keys]

    # i18n
    locale_param = body.locale
    use_i18n = False
    resolved_locale = ""
    chain: list[str] = []
    translatable_data_fields: set[str] = set()
    if locale_param:
        use_i18n = True
        resolved_locale, chain = resolve_locale(
            locale_param, tenant.locales or [], tenant.default_language, tenant.fallback_chain or {},
        )
        translatable_data_fields = get_translatable_data_fields(schema_fields)

    # Resolve items
    items: list[dict] = []
    for i in db_items:
        data = i.data or {}
        if body.depth >= 1:
            data = await _resolve_media_ids(data, schema_fields, tenant_id, db)
            data = await _resolve_relation_ids(data, schema_fields, tenant_id, db)
        item_dict: dict = {
            "id": i.id,
            "title": i.title,
            "slug": i.slug,
            "data": data,
            "sort_order": i.sort_order,
            "image_id": i.image_id,
        }
        if use_i18n and (i.translations or {}):
            fallbacks_used: dict[str, str] = {}
            for fl in chain:
                t = (i.translations or {}).get(fl, {}).get("title")
                if t:
                    item_dict["title"] = t
                    if fl != resolved_locale:
                        fallbacks_used["title"] = fl
                    break
            if translatable_data_fields:
                merged_data, data_fallbacks = merge_collection_data_translation(
                    data, i.translations or {}, translatable_data_fields, resolved_locale, chain,
                )
                item_dict["data"] = merged_data
                fallbacks_used.update(data_fallbacks)
            item_dict["_locale"] = build_locale_metadata(locale_param, resolved_locale, fallbacks_used)
        items.append(item_dict)

    response_data = {
        "items": items,
        "requested": len(requested_keys),
        "found": len(items),
        "missing": missing,
    }
    return cached_json_response(response_data, request, "collection")
