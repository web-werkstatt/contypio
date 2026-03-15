from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.media_folder import BreadcrumbItem, FolderCreate, FolderRead, FolderUpdate
from app.services import media_folder_service

router = APIRouter(prefix="/api/media/folders", tags=["media-folders"])


@router.get("", response_model=list[FolderRead])
async def list_folders(
    parent_id: int | None = Query(None),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await media_folder_service.list_folders(user.tenant_id, parent_id, db)


@router.post("", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    data: FolderCreate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        folder = await media_folder_service.create_folder(
            user.tenant_id, data.name, data.parent_id, db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return FolderRead(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        position=folder.position,
        created_at=folder.created_at,
    )


@router.patch("/{folder_id}", response_model=FolderRead)
async def update_folder(
    folder_id: int,
    data: FolderUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        folder = await media_folder_service.update_folder(
            folder_id, user.tenant_id, data.model_dump(exclude_unset=True), db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not folder:
        raise HTTPException(status_code=404, detail="Ordner nicht gefunden")
    return FolderRead(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        position=folder.position,
        created_at=folder.created_at,
    )


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        deleted = await media_folder_service.delete_folder(folder_id, user.tenant_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Ordner nicht gefunden")


@router.get("/{folder_id}/breadcrumb", response_model=list[BreadcrumbItem])
async def folder_breadcrumb(
    folder_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await media_folder_service.get_breadcrumb(folder_id, user.tenant_id, db)
