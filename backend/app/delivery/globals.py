from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.delivery.cache_headers import cached_json_response
from app.delivery.tenant_resolver import get_delivery_tenant_id
from app.models.global_config import CmsGlobal
from app.models.media import CmsMedia

router = APIRouter(prefix="/content/globals", tags=["Content Delivery API"])


async def _resolve_media_in_data(data: dict, tenant_id: UUID, db: AsyncSession) -> dict:
    """Resolve media IDs in global data to full URLs.

    Scans all values for integer IDs that could be media references,
    then batch-resolves them.
    """
    # Collect potential media IDs (integers in known patterns)
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
    """Recursively find imageId / image_id / mediaId values."""
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
    """Replace media ID references with resolved media objects."""
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


@router.get("/", response_model=None, summary="List all globals", description="Fetch all globals in one batch request. Optimized for static site builds.")
async def list_globals(
    request: Request,
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Fetch all globals in one request (batch endpoint for build performance)."""
    result = await db.execute(
        select(CmsGlobal).where(CmsGlobal.tenant_id == tenant_id)
    )
    globals_list = list(result.scalars().all())

    items = []
    for item in globals_list:
        data = await _resolve_media_in_data(item.data or {}, tenant_id, db)
        items.append({
            "slug": item.slug,
            "label": item.label,
            "data": data,
        })

    return cached_json_response(items, request, "globals")


@router.get("/{slug}", summary="Get global by slug", description="Fetch a single global configuration by its slug. Resolves media references automatically.")
async def get_global(
    slug: str,
    request: Request,
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):

    result = await db.execute(
        select(CmsGlobal).where(
            CmsGlobal.tenant_id == tenant_id,
            CmsGlobal.slug == slug,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Global not found")

    data = await _resolve_media_in_data(item.data or {}, tenant_id, db)
    response_data = {
        "slug": item.slug,
        "label": item.label,
        "data": data,
    }

    return cached_json_response(response_data, request, "globals", updated_at=item.updated_at)
