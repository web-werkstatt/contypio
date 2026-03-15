import uuid as uuid_mod

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import CmsMedia
from app.models.media_folder import CmsMediaFolder


MAX_DEPTH = 5


async def list_folders(
    tenant_id: uuid_mod.UUID,
    parent_id: int | None,
    db: AsyncSession,
) -> list[dict]:
    query = (
        select(CmsMediaFolder)
        .where(CmsMediaFolder.tenant_id == tenant_id)
        .order_by(CmsMediaFolder.position, CmsMediaFolder.name)
    )
    if parent_id is None:
        query = query.where(CmsMediaFolder.parent_id.is_(None))
    else:
        query = query.where(CmsMediaFolder.parent_id == parent_id)

    result = await db.execute(query)
    folders = result.scalars().all()

    enriched = []
    for f in folders:
        file_count = (await db.execute(
            select(func.count()).select_from(CmsMedia)
            .where(CmsMedia.tenant_id == tenant_id, CmsMedia.folder_id == f.id)
        )).scalar() or 0
        subfolder_count = (await db.execute(
            select(func.count()).select_from(CmsMediaFolder)
            .where(CmsMediaFolder.tenant_id == tenant_id, CmsMediaFolder.parent_id == f.id)
        )).scalar() or 0
        enriched.append({
            "id": f.id,
            "name": f.name,
            "parent_id": f.parent_id,
            "position": f.position,
            "created_at": f.created_at,
            "file_count": file_count,
            "subfolder_count": subfolder_count,
        })
    return enriched


async def create_folder(
    tenant_id: uuid_mod.UUID,
    name: str,
    parent_id: int | None,
    db: AsyncSession,
) -> CmsMediaFolder:
    if parent_id is not None:
        depth = await _get_depth(parent_id, tenant_id, db)
        if depth >= MAX_DEPTH:
            raise ValueError(f"Maximale Ordnertiefe von {MAX_DEPTH} erreicht")
        parent = await _get_folder(parent_id, tenant_id, db)
        if not parent:
            raise ValueError("Übergeordneter Ordner nicht gefunden")

    folder = CmsMediaFolder(
        tenant_id=tenant_id,
        name=name,
        parent_id=parent_id,
    )
    db.add(folder)
    await db.flush()
    await db.refresh(folder)
    return folder


async def update_folder(
    folder_id: int,
    tenant_id: uuid_mod.UUID,
    data: dict,
    db: AsyncSession,
) -> CmsMediaFolder | None:
    folder = await _get_folder(folder_id, tenant_id, db)
    if not folder:
        return None

    if "parent_id" in data and data["parent_id"] is not None:
        if data["parent_id"] == folder_id:
            raise ValueError("Ordner kann nicht in sich selbst verschoben werden")
        depth = await _get_depth(data["parent_id"], tenant_id, db)
        if depth >= MAX_DEPTH:
            raise ValueError(f"Maximale Ordnertiefe von {MAX_DEPTH} erreicht")

    for key, value in data.items():
        if value is not None:
            setattr(folder, key, value)
    await db.flush()
    await db.refresh(folder)
    return folder


async def delete_folder(
    folder_id: int,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> bool:
    folder = await _get_folder(folder_id, tenant_id, db)
    if not folder:
        return False

    file_count = (await db.execute(
        select(func.count()).select_from(CmsMedia)
        .where(CmsMedia.tenant_id == tenant_id, CmsMedia.folder_id == folder_id)
    )).scalar() or 0
    if file_count > 0:
        raise ValueError(f"Ordner enthält {file_count} Dateien und kann nicht gelöscht werden")

    subfolder_count = (await db.execute(
        select(func.count()).select_from(CmsMediaFolder)
        .where(CmsMediaFolder.tenant_id == tenant_id, CmsMediaFolder.parent_id == folder_id)
    )).scalar() or 0
    if subfolder_count > 0:
        raise ValueError(f"Ordner enthält {subfolder_count} Unterordner und kann nicht gelöscht werden")

    await db.delete(folder)
    return True


async def get_breadcrumb(
    folder_id: int,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> list[dict]:
    crumbs = []
    current_id: int | None = folder_id
    while current_id is not None:
        folder = await _get_folder(current_id, tenant_id, db)
        if not folder:
            break
        crumbs.append({"id": folder.id, "name": folder.name})
        current_id = folder.parent_id
    crumbs.reverse()
    return crumbs


async def _get_folder(
    folder_id: int,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> CmsMediaFolder | None:
    result = await db.execute(
        select(CmsMediaFolder)
        .where(CmsMediaFolder.id == folder_id, CmsMediaFolder.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()


async def _get_depth(folder_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> int:
    depth = 1
    current_id: int | None = folder_id
    while current_id is not None:
        folder = await _get_folder(current_id, tenant_id, db)
        if not folder or not folder.parent_id:
            break
        current_id = folder.parent_id
        depth += 1
    return depth
