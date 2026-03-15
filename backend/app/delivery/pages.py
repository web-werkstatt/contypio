from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.delivery.cache_headers import cached_json_response
from app.delivery.query_params import PaginationParams, SparseFieldsParams, paginated_response
from app.delivery.resolve import build_media_cache, collect_image_ids, resolve_dynamic_blocks, resolve_grid_layouts, resolve_sections
from app.delivery.tenant_resolver import get_delivery_tenant_id
from app.models.page import CmsPage

router = APIRouter(prefix="/content", tags=["Content Delivery API"])

# Fields always included in sparse responses
_ALWAYS_FIELDS = {"id", "slug", "path"}
# Fields allowed for sparse selection
_ALLOWED_FIELDS = {"title", "hero", "seo", "sections", "page_type", "published_at", "collection_key", "parent_id"}


def _apply_sparse_fields(page_dict: dict, field_set: set[str] | None) -> dict:
    """Filter response dict to only requested fields (+ always-included fields)."""
    if not field_set:
        return page_dict
    allowed = _ALWAYS_FIELDS | (field_set & _ALLOWED_FIELDS) | _ALWAYS_FIELDS
    return {k: v for k, v in page_dict.items() if k in allowed}


async def _fetch_single_page(
    slug: str,
    request: Request,
    include_css: bool,
    sparse: SparseFieldsParams,
    tenant_id: UUID,
    db: AsyncSession,
    path: str | None = None,
):
    """Shared logic for fetching a single published page by slug or path."""
    query = select(CmsPage).where(
        CmsPage.tenant_id == tenant_id,
        CmsPage.status == "published",
    )
    if path:
        query = query.where(CmsPage.path == path)
    else:
        query = query.where(CmsPage.slug == slug)

    result = await db.execute(query)
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    field_set = sparse.field_set()
    needs_sections = field_set is None or "sections" in field_set

    sections = page.sections or []
    if needs_sections:
        sections = await resolve_dynamic_blocks(sections, tenant_id=tenant_id, db=db)
        image_ids = await collect_image_ids(sections)
        media_cache = await build_media_cache(image_ids, tenant_id, db)
        resolved = resolve_sections(sections, media_cache)
        resolved = resolve_grid_layouts(resolved, include_css=include_css)
    else:
        resolved = []

    response: dict = {
        "id": page.id,
        "title": page.title,
        "slug": page.slug,
        "path": page.path,
        "page_type": page.page_type,
        "collection_key": page.collection_key,
        "seo": page.seo or {},
        "hero": page.hero or {},
        "sections": resolved,
        "published_at": page.published_at.isoformat() if page.published_at else None,
    }

    if needs_sections and page.collection_key:
        try:
            from app.delivery.collections import get_collection
            collection_resp = await get_collection(page.collection_key, request, tenant_id=tenant_id, db=db)
            import json
            response["collection"] = json.loads(collection_resp.body.decode())
        except Exception:
            response["collection"] = {"items": [], "total": 0}

    response = _apply_sparse_fields(response, field_set)
    return cached_json_response(response, request, "page", updated_at=page.updated_at)


@router.get("/pages/{slug}", summary="Get page by slug", description="Fetch a single published page by its slug. Returns full page with resolved sections, media and dynamic blocks.")
async def get_page_by_slug(
    slug: str,
    request: Request,
    include_css: bool = False,
    sparse: SparseFieldsParams = Depends(),
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    return await _fetch_single_page(slug, request, include_css, sparse, tenant_id, db)


@router.get("/page", summary="Get page by query param (deprecated)", description="Deprecated: Use /content/pages/{slug} instead. Kept for backwards compatibility.", deprecated=True)
async def get_page(
    request: Request,
    path: str | None = None,
    slug: str | None = None,
    include_css: bool = False,
    sparse: SparseFieldsParams = Depends(),
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    if not path and not slug:
        raise HTTPException(status_code=400, detail="path or slug required")
    return await _fetch_single_page(slug or "", request, include_css, sparse, tenant_id, db, path=path)


@router.get("/pages", summary="List published pages", description="List all published pages with optional filtering by page_type or parent. No section resolution for performance.")
async def list_pages(
    request: Request,
    page_type: str | None = None,
    parent_id: int | None = None,
    pagination: PaginationParams = Depends(),
    sparse: SparseFieldsParams = Depends(),
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List published pages with optional filters. No section resolution for performance."""
    base_filter = [
        CmsPage.tenant_id == tenant_id,
        CmsPage.status == "published",
    ]
    if page_type:
        base_filter.append(CmsPage.page_type == page_type)
    if parent_id is not None:
        base_filter.append(CmsPage.parent_id == parent_id)

    # Total count
    count_result = await db.execute(
        select(func.count(CmsPage.id)).where(*base_filter)
    )
    total = count_result.scalar() or 0

    # Fetch pages
    result = await db.execute(
        select(CmsPage)
        .where(*base_filter)
        .order_by(CmsPage.sort_order, CmsPage.title)
        .limit(pagination.limit)
        .offset(pagination.offset)
    )
    pages = list(result.scalars().all())

    field_set = sparse.field_set()
    items = []
    for p in pages:
        item = {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "path": p.path,
            "page_type": p.page_type,
            "seo": p.seo or {},
            "hero": p.hero or {},
            "published_at": p.published_at.isoformat() if p.published_at else None,
        }
        item = _apply_sparse_fields(item, field_set)
        items.append(item)

    response_data = paginated_response(items, total, pagination.limit, pagination.offset)
    return cached_json_response(response_data, request, "pages")


@router.get("/tree", summary="Page tree", description="Hierarchical page tree with parent-child relationships. Useful for navigation menus.")
async def get_tree(
    request: Request,
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsPage).where(
            CmsPage.tenant_id == tenant_id,
            CmsPage.status == "published",
        ).order_by(CmsPage.sort_order, CmsPage.title)
    )
    pages = list(result.scalars().all())

    page_map: dict[int, dict] = {}
    roots: list[dict] = []

    for p in pages:
        node = {
            "id": p.id, "title": p.title, "slug": p.slug, "path": p.path,
            "page_type": p.page_type, "children": [],
        }
        page_map[p.id] = node

    for p in pages:
        node = page_map[p.id]
        if p.parent_id and p.parent_id in page_map:
            page_map[p.parent_id]["children"].append(node)
        else:
            roots.append(node)

    return cached_json_response(roots, request, "tree")


# ---------------------------------------------------------------------------
# Batch endpoint — fetch multiple pages in a single request
# ---------------------------------------------------------------------------

class BatchPagesRequest(BaseModel):
    slugs: list[str] = Field(..., min_length=1, max_length=50, description="Page slugs to fetch (max 50)")
    fields: str | None = Field(default=None, description="Comma-separated sparse fields")
    include_css: bool = Field(default=False, description="Include CSS for grid layouts")


@router.post("/pages/batch", summary="Batch fetch pages", description="Fetch multiple pages by slug in a single request. Max 50 slugs. Returns a map of slug→page (null if not found).")
async def batch_pages(
    body: BatchPagesRequest,
    request: Request,
    tenant_id: UUID = Depends(get_delivery_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    # Parse sparse fields
    field_set: set[str] | None = None
    if body.fields:
        field_set = {f.strip() for f in body.fields.split(",") if f.strip()}

    needs_sections = field_set is None or "sections" in field_set

    # Single query: WHERE slug IN (...)
    result = await db.execute(
        select(CmsPage).where(
            CmsPage.tenant_id == tenant_id,
            CmsPage.status == "published",
            CmsPage.slug.in_(body.slugs),
        )
    )
    pages_by_slug: dict[str, CmsPage] = {p.slug: p for p in result.scalars().all()}

    items: dict[str, dict | None] = {}
    not_found: list[str] = []

    for slug in body.slugs:
        page = pages_by_slug.get(slug)
        if not page:
            items[slug] = None
            not_found.append(slug)
            continue

        sections = page.sections or []
        if needs_sections:
            sections = await resolve_dynamic_blocks(sections, tenant_id=tenant_id, db=db)
            image_ids = await collect_image_ids(sections)
            media_cache = await build_media_cache(image_ids, tenant_id, db)
            resolved = resolve_sections(sections, media_cache)
            resolved = resolve_grid_layouts(resolved, include_css=body.include_css)
        else:
            resolved = []

        page_dict: dict = {
            "id": page.id,
            "title": page.title,
            "slug": page.slug,
            "path": page.path,
            "page_type": page.page_type,
            "collection_key": page.collection_key,
            "seo": page.seo or {},
            "hero": page.hero or {},
            "sections": resolved,
            "published_at": page.published_at.isoformat() if page.published_at else None,
        }
        items[slug] = _apply_sparse_fields(page_dict, field_set)

    resolved_count = len(body.slugs) - len(not_found)
    response_data = {
        "items": items,
        "resolved": resolved_count,
        "not_found": not_found,
    }
    return cached_json_response(response_data, request, "pages")
