from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.page import PageCreate, PageRead, PageTreeItem, PageUpdate
from app.services import page_service
from app.services.usage_service import check_limit
from app.services.webhook_service import dispatch_event

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.get("")
async def list_pages(
    view: str = Query("flat", pattern="^(flat|tree)$"),
    status_filter: str | None = Query(None, alias="status"),
    page_type: str | None = None,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if view == "tree":
        return await page_service.get_tree(user.tenant_id, db)
    pages = await page_service.list_pages(user.tenant_id, db, status_filter, page_type)
    return [PageRead.model_validate(p) for p in pages]


@router.post("", response_model=PageRead, status_code=status.HTTP_201_CREATED)
async def create_page(
    data: PageCreate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed, msg = await check_limit(user.tenant_id, "page", db)
    if not allowed:
        raise HTTPException(status_code=403, detail=msg)
    page = await page_service.create_page(user.tenant_id, data, user.id, db)
    await dispatch_event("page.created", {"id": page.id, "slug": page.slug, "title": page.title}, user.tenant_id, db)
    return page


@router.put("/reorder")
async def reorder_pages(
    body: list[dict] = Body(...),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await page_service.reorder_pages(user.tenant_id, body, db)
    return {"ok": True}


@router.get("/{page_id}", response_model=PageRead)
async def get_page(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await page_service.get_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/{page_id}", response_model=PageRead)
@router.patch("/{page_id}", response_model=PageRead)
async def update_page(
    page_id: int,
    data: PageUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await page_service.update_page(page_id, user.tenant_id, data, db, user_id=user.id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    await dispatch_event("page.updated", {"id": page.id, "slug": page.slug, "title": page.title}, user.tenant_id, db)
    return page


@router.post("/{page_id}/publish", response_model=PageRead)
async def publish_page(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await page_service.publish_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    await dispatch_event("page.published", {"id": page.id, "slug": page.slug, "title": page.title, "path": f"/{page.slug}"}, user.tenant_id, db)
    return page


@router.post("/{page_id}/unpublish", response_model=PageRead)
async def unpublish_page(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await page_service.unpublish_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    await dispatch_event("page.unpublished", {"id": page.id, "slug": page.slug, "title": page.title}, user.tenant_id, db)
    return page


@router.post("/sync-globals")
async def sync_globals_to_pages(
    force: bool = False,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Convert page-specific globals into page sections automatically."""
    from app.services.globals_to_sections import sync_globals_to_pages as do_sync
    result = await do_sync(user.tenant_id, db, force=force)
    await db.commit()
    return result


@router.post("/auto-organize")
async def auto_organize_pages(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Auto-organize pages into a logical hierarchy."""
    result = await page_service.auto_organize(user.tenant_id, db)
    await db.commit()
    return result


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch page info before deletion for the webhook payload
    page = await page_service.get_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    page_info = {"id": page.id, "slug": page.slug, "title": page.title}
    deleted = await page_service.delete_page(page_id, user.tenant_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Page not found")
    await dispatch_event("page.deleted", page_info, user.tenant_id, db)
