"""Delivery API for globals — reads from singleton collections.

Provides backwards-compatible endpoints under /content/globals/ that
read from cms_collections (where schema.singleton=True) instead of
the legacy cms_globals table. Falls back to cms_globals for items
not yet migrated.

Response format is identical: { slug, label, data }
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.content_i18n import (
    build_locale_metadata,
    merge_translation,
    resolve_locale,
)
from app.core.database import get_db
from app.delivery.cache_headers import cached_json_response
from app.delivery.query_params import LocaleParams
from app.delivery.tenant_resolver import get_delivery_tenant
from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.global_config import CmsGlobal
from app.models.media import CmsMedia
from app.models.tenant import CmsTenant

router = APIRouter(prefix="/content/globals", tags=["Content Delivery API"])


# ---------------------------------------------------------------------------
# Media resolution (shared helper)
# ---------------------------------------------------------------------------

async def _resolve_media_in_data(data: dict, tenant_id: UUID, db: AsyncSession) -> dict:
    """Resolve media IDs in global data to full URLs."""
    ids_to_resolve: set[int] = set()
    _collect_media_ids_recursive(data, ids_to_resolve)

    if not ids_to_resolve:
        return data

    result = await db.execute(
        select(CmsMedia).where(CmsMedia.id.in_(ids_to_resolve), CmsMedia.tenant_id == tenant_id)
    )
    base_url = settings.API_ASSET_URL.rstrip("/")
    media_map: dict[int, dict] = {}
    for m in result.scalars().all():
        media_map[m.id] = {
            "id": m.id,
            "url": f"{base_url}{m.url}",
            "alt": m.alt or "",
            "width": m.width,
            "height": m.height,
        }

    resolved = _replace_media_ids_recursive(data, media_map)
    return resolved if isinstance(resolved, dict) else data


def _collect_media_ids_recursive(obj: dict | list, ids: set[int]) -> None:
    if isinstance(obj, dict):
        for key, val in obj.items():
            if key in ("imageId", "image_id", "mediaId") and isinstance(val, int) and val > 0:
                ids.add(val)
            elif isinstance(val, (dict, list)):
                _collect_media_ids_recursive(val, ids)
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                _collect_media_ids_recursive(item, ids)


def _replace_media_ids_recursive(obj: dict | list, media_map: dict[int, dict]) -> dict | list:
    if isinstance(obj, dict):
        result = {}
        for key, val in obj.items():
            if key in ("imageId", "image_id", "mediaId") and isinstance(val, int) and val in media_map:
                result[key] = val
                result["image"] = media_map[val]
            elif isinstance(val, (dict, list)):
                result[key] = _replace_media_ids_recursive(val, media_map)
            else:
                result[key] = val
        return result
    elif isinstance(obj, list):
        return [
            _replace_media_ids_recursive(item, media_map) if isinstance(item, (dict, list)) else item
            for item in obj
        ]
    return obj


# ---------------------------------------------------------------------------
# i18n helper
# ---------------------------------------------------------------------------

def _apply_locale(
    response: dict,
    translations: dict,
    translatable_fields: set[str],
    locale_param: str | None,
    tenant: CmsTenant,
) -> dict:
    if not locale_param:
        return response

    resolved, chain = resolve_locale(
        locale_param, tenant.locales or [], tenant.default_language, tenant.fallback_chain or {},
    )
    if not translations:
        response["_locale"] = build_locale_metadata(locale_param, resolved, {})
        return response

    merged, fallbacks_used = merge_translation(
        response, translations, translatable_fields, resolved, chain,
    )
    merged["_locale"] = build_locale_metadata(locale_param, resolved, fallbacks_used)
    return merged


def _get_translatable_fields(schema: CmsCollectionSchema | None) -> set[str]:
    """Derive translatable field names from schema (text-like fields in data)."""
    if not schema or not schema.fields:
        return {"data.site_name", "data.tagline", "data.address"}
    fields: set[str] = set()
    for f in schema.fields:
        ftype = f.get("type", "text") if isinstance(f, dict) else getattr(f, "type", "text")
        fname = f.get("name", "") if isinstance(f, dict) else getattr(f, "name", "")
        if ftype in ("text", "textarea", "richtext"):
            fields.add(f"data.{fname}")
    return fields


# ---------------------------------------------------------------------------
# Internal: load singleton item or fall back to legacy cms_globals
# ---------------------------------------------------------------------------

async def _load_global(
    slug: str, tenant_id: UUID, db: AsyncSession,
) -> tuple[dict, dict, CmsCollectionSchema | None, CmsCollection | CmsGlobal | None]:
    """Load a global by slug. Tries singleton collections first, falls back to cms_globals.

    Returns (data_dict, translations_dict, schema_or_none, orm_item).
    """
    # 1. Try singleton collection
    schema_result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.collection_key == slug,
            CmsCollectionSchema.singleton.is_(True),
        )
    )
    schema = schema_result.scalar_one_or_none()

    if schema:
        item_result = await db.execute(
            select(CmsCollection).where(
                CmsCollection.tenant_id == tenant_id,
                CmsCollection.collection_key == slug,
                CmsCollection.deleted_at.is_(None),
            ).limit(1)
        )
        item = item_result.scalar_one_or_none()
        if item:
            return item.data or {}, item.translations or {}, schema, item

    # 2. Fallback: legacy cms_globals table
    legacy_result = await db.execute(
        select(CmsGlobal).where(
            CmsGlobal.tenant_id == tenant_id,
            CmsGlobal.slug == slug,
        )
    )
    legacy_item = legacy_result.scalar_one_or_none()
    if legacy_item:
        return legacy_item.data or {}, legacy_item.translations or {}, None, legacy_item

    return {}, {}, None, None


async def _load_all_globals(
    tenant_id: UUID, db: AsyncSession,
) -> list[tuple[str, str, dict, dict, CmsCollectionSchema | None, CmsCollection | CmsGlobal]]:
    """Load all globals (singleton collections + legacy cms_globals)."""
    results = []
    seen_slugs: set[str] = set()

    # 1. Singleton collections
    schema_result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.singleton.is_(True),
        )
    )
    for schema in schema_result.scalars().all():
        item_result = await db.execute(
            select(CmsCollection).where(
                CmsCollection.tenant_id == tenant_id,
                CmsCollection.collection_key == schema.collection_key,
                CmsCollection.deleted_at.is_(None),
            ).limit(1)
        )
        item = item_result.scalar_one_or_none()
        if item:
            results.append((schema.collection_key, schema.label, item.data or {}, item.translations or {}, schema, item))
            seen_slugs.add(schema.collection_key)

    # 2. Legacy cms_globals (only those not already covered by singleton collections)
    legacy_result = await db.execute(
        select(CmsGlobal).where(CmsGlobal.tenant_id == tenant_id)
    )
    for legacy_item in legacy_result.scalars().all():
        if legacy_item.slug not in seen_slugs:
            results.append((legacy_item.slug, legacy_item.label, legacy_item.data or {}, legacy_item.translations or {}, None, legacy_item))

    return results


# ---------------------------------------------------------------------------
# Delivery endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=None, summary="List all globals", description="Fetch all globals in one batch request. Optimized for static site builds.")
async def list_globals(
    request: Request,
    locale_params: LocaleParams = Depends(),
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    tenant_id = tenant.id
    all_globals = await _load_all_globals(tenant_id, db)

    items = []
    for slug, label, data, translations, schema, _orm_item in all_globals:
        resolved_data = await _resolve_media_in_data(data, tenant_id, db)
        resp = {"slug": slug, "label": label, "data": resolved_data}
        translatable = _get_translatable_fields(schema)
        resp = _apply_locale(resp, translations, translatable, locale_params.locale, tenant)
        items.append(resp)

    return cached_json_response(items, request, "globals")


@router.get("/{slug}", summary="Get global by slug", description="Fetch a single global configuration by its slug. Resolves media references automatically.")
async def get_global(
    slug: str,
    request: Request,
    locale_params: LocaleParams = Depends(),
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    tenant_id = tenant.id
    data, translations, schema, orm_item = await _load_global(slug, tenant_id, db)

    if orm_item is None:
        raise HTTPException(status_code=404, detail="Global not found")

    resolved_data = await _resolve_media_in_data(data, tenant_id, db)
    label = schema.label if schema else getattr(orm_item, "label", slug)
    updated_at = getattr(orm_item, "updated_at", None)

    response_data = {"slug": slug, "label": label, "data": resolved_data}
    translatable = _get_translatable_fields(schema)
    response_data = _apply_locale(response_data, translations, translatable, locale_params.locale, tenant)

    return cached_json_response(response_data, request, "globals", updated_at=updated_at)
