from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.tenant import CmsTenant
from app.schemas.media import (
    BulkDeleteRequest,
    BulkMoveRequest,
    BulkTagRequest,
    MediaList,
    MediaRead,
    MediaUpdate,
)
from app.services import media_service
from app.services.usage_service import check_limit
from app.services.webhook_service import dispatch_event

router = APIRouter(prefix="/api/media", tags=["media"])


async def _get_tenant_slug(user: CmsUser, db: AsyncSession) -> str:
    result = await db.execute(select(CmsTenant).where(CmsTenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    return tenant.slug if tenant else "default"


@router.post("/upload", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    alt: str = Form(""),
    category: str = Form("general"),
    folder_id: int | None = Form(None),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed, msg = await check_limit(user.tenant_id, "media", db)
    if not allowed:
        raise HTTPException(status_code=403, detail=msg)
    tenant_slug = await _get_tenant_slug(user, db)
    try:
        media = await media_service.upload(file, user.tenant_id, tenant_slug, user.id, db, folder_id=folder_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if alt:
        media.alt = alt
    if category != "general":
        media.category = category
    await dispatch_event("media.uploaded", {"id": media.id, "filename": media.filename}, user.tenant_id, db)
    return media


@router.get("", response_model=MediaList)
async def list_media(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = None,
    search: str | None = None,
    folder_id: int | None = None,
    root: bool = Query(False, description="Nur Dateien ohne Ordner"),
    type: str | None = Query(None, description="image, document, video"),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await media_service.list_media(
        user.tenant_id, db, page, per_page, category, search,
        folder_id=folder_id,
        show_root_only=root and folder_id is None,
        mime_filter=type,
    )
    return MediaList(items=items, total=total, page=page, per_page=per_page)


@router.get("/{media_id}", response_model=MediaRead)
async def get_media(
    media_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    media = await media_service.get_media(media_id, user.tenant_id, db)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.patch("/{media_id}", response_model=MediaRead)
async def update_media(
    media_id: int,
    data: MediaUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    media = await media_service.update_media(media_id, user.tenant_id, data.model_dump(exclude_unset=True), db)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.get("/{media_id}/usage")
async def media_usage(
    media_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Find pages that reference this media ID in their sections."""
    from app.models.page import CmsPage
    result = await db.execute(
        select(CmsPage).where(CmsPage.tenant_id == user.tenant_id)
    )
    pages = result.scalars().all()
    usage = []
    str_id = str(media_id)
    for pg in pages:
        for section in (pg.sections or []):
            for column in section.get("columns", []):
                for block in column.get("blocks", []):
                    data = block.get("data", {})
                    if str(data.get("imageId", "")) == str_id:
                        usage.append({"id": pg.id, "title": pg.title, "block_type": block.get("blockType", "")})
                    for item in data.get("images", []) + data.get("items", []) + data.get("tiles", []) + data.get("slides", []):
                        if str(item.get("imageId", "")) == str_id:
                            usage.append({"id": pg.id, "title": pg.title, "block_type": block.get("blockType", "")})
                            break
    seen = set()
    unique = []
    for u in usage:
        key = (u["id"], u["block_type"])
        if key not in seen:
            seen.add(key)
            unique.append(u)
    return {"pages": unique}


@router.post("/bulk/move")
async def bulk_move(
    data: BulkMoveRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await media_service.bulk_move(data.ids, data.folder_id, user.tenant_id, db)
    return {"moved": count}


@router.post("/bulk/delete")
async def bulk_delete(
    data: BulkDeleteRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await media_service.bulk_delete(data.ids, user.tenant_id, db)
    await dispatch_event("media.bulk_deleted", {"count": count}, user.tenant_id, db)
    return {"deleted": count}


@router.post("/bulk/tag")
async def bulk_tag(
    data: BulkTagRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await media_service.bulk_tag(data.ids, data.tags, data.action, user.tenant_id, db)
    return {"updated": count}


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await media_service.delete_media(media_id, user.tenant_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Media not found")
    await dispatch_event("media.deleted", {"id": media_id}, user.tenant_id, db)
