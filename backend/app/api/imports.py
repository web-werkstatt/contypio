"""Import/Export API endpoints."""

from fastapi import APIRouter, Body, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.importers.base import ImportMapping
from app.importers.registry import get_importer, list_importers
from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.global_config import CmsGlobal
from app.models.page import CmsPage

router = APIRouter(prefix="/api/import", tags=["import"])
export_router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/providers")
async def get_providers(user: CmsUser = Depends(get_current_user)):
    """List available import providers."""
    return list_importers()


@router.post("/test-connection")
async def test_connection(
    body: dict = Body(...),
    user: CmsUser = Depends(get_current_user),
):
    """Test connection to an import source."""
    provider = body.get("provider")
    config = body.get("config", {})
    if not provider:
        raise HTTPException(400, "provider required")
    try:
        importer = get_importer(provider)
    except ValueError:
        raise HTTPException(400, f"Unknown provider: {provider}")
    ok, message = await importer.test_connection(config)
    return {"ok": ok, "message": message}


@router.post("/discover")
async def discover(
    body: dict = Body(...),
    user: CmsUser = Depends(get_current_user),
):
    """Discover what's available in the source system."""
    provider = body.get("provider")
    config = body.get("config", {})
    if not provider:
        raise HTTPException(400, "provider required")
    try:
        importer = get_importer(provider)
    except ValueError:
        raise HTTPException(400, f"Unknown provider: {provider}")

    ok, msg = await importer.test_connection(config)
    if not ok:
        raise HTTPException(400, f"Connection failed: {msg}")

    manifest = await importer.discover(config)
    return {
        "globals": [{"key": g.key, "label": g.label, "field_count": g.field_count}
                     for g in manifest.globals],
        "collections": [{"key": c.key, "label": c.label, "count": c.count}
                        for c in manifest.collections],
        "pages": {"count": manifest.pages.count, "has_tree": manifest.pages.has_tree},
        "media": {"count": manifest.media.count,
                  "total_size_bytes": manifest.media.total_size_bytes},
    }


@router.post("/execute")
async def execute_import(
    body: dict = Body(...),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute an import with the given mapping."""
    provider = body.get("provider")
    config = body.get("config", {})
    mapping_raw = body.get("mapping", {})

    if not provider:
        raise HTTPException(400, "provider required")
    try:
        importer = get_importer(provider)
    except ValueError:
        raise HTTPException(400, f"Unknown provider: {provider}")

    mapping = ImportMapping(
        globals=mapping_raw.get("globals", []),
        collections=mapping_raw.get("collections", []),
        import_pages=mapping_raw.get("import_pages", False),
        import_media=mapping_raw.get("import_media", False),
        conflict=mapping_raw.get("conflict", "skip"),
    )

    result = await importer.import_data(config, mapping, user.tenant_id, db)
    return result.to_dict()


@router.post("/upload-json")
async def upload_json_import(
    file: UploadFile = File(...),
    user: CmsUser = Depends(get_current_user),
):
    """Upload a JSON file and return its contents for preview."""
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(400, "Only .json files accepted")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "File too large (max 10MB)")
    import json
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Invalid JSON: {e}")
    return {"data": data, "size_bytes": len(content)}


# ========================================
# EXPORT
# ========================================

@export_router.get("/full")
async def export_full(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all CMS data as JSON (for backup or migration)."""
    tid = user.tenant_id

    # Globals
    result = await db.execute(select(CmsGlobal).where(CmsGlobal.tenant_id == tid))
    globals_data = {}
    for g in result.scalars().all():
        globals_data[g.slug] = {"label": g.label, "data": g.data}

    # Pages
    result = await db.execute(
        select(CmsPage).where(CmsPage.tenant_id == tid)
        .order_by(CmsPage.sort_order))
    pages = []
    for p in result.scalars().all():
        pages.append({
            "title": p.title, "slug": p.slug, "path": p.path,
            "page_type": p.page_type, "status": p.status,
            "collection_key": p.collection_key,
            "seo": p.seo, "hero": p.hero, "sections": p.sections,
            "sort_order": p.sort_order,
        })

    # Collections (schemas + items)
    result = await db.execute(
        select(CmsCollectionSchema).where(CmsCollectionSchema.tenant_id == tid))
    collections = {}
    for schema in result.scalars().all():
        items_result = await db.execute(
            select(CmsCollection).where(
                CmsCollection.collection_key == schema.collection_key,
                CmsCollection.tenant_id == tid)
            .order_by(CmsCollection.sort_order))
        items = []
        for item in items_result.scalars().all():
            items.append({
                "title": item.title, "slug": item.slug,
                "data": item.data, "status": item.status,
                "sort_order": item.sort_order,
            })
        collections[schema.collection_key] = {
            "label": schema.label,
            "label_singular": schema.label_singular,
            "icon": schema.icon,
            "schema": {"fields": schema.fields},
            "items": items,
        }

    return {
        "format": "cms-export-v1",
        "globals": globals_data,
        "pages": pages,
        "collections": collections,
    }
