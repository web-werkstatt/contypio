import uuid as uuid_mod
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.media import CmsMedia

THUMBNAIL_SIZES = {"sm": 400, "md": 800, "lg": 1200}
IMAGE_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
DOCUMENT_MIME = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
VIDEO_MIME = {"video/mp4", "video/webm"}
ALLOWED_MIME = IMAGE_MIME | DOCUMENT_MIME | VIDEO_MIME

MAX_SIZE_IMAGE = 10 * 1024 * 1024       # 10 MB
MAX_SIZE_DOCUMENT = 25 * 1024 * 1024     # 25 MB
MAX_SIZE_VIDEO = 100 * 1024 * 1024       # 100 MB


def _get_max_size(mime_type: str) -> int:
    if mime_type in IMAGE_MIME:
        return MAX_SIZE_IMAGE
    if mime_type in VIDEO_MIME:
        return MAX_SIZE_VIDEO
    return MAX_SIZE_DOCUMENT


async def upload(
    file: UploadFile,
    tenant_id: uuid_mod.UUID,
    tenant_slug: str,
    user_id: uuid_mod.UUID,
    db: AsyncSession,
    folder_id: int | None = None,
) -> CmsMedia:
    if file.content_type not in ALLOWED_MIME:
        raise ValueError(f"Dateityp nicht erlaubt: {file.content_type}")

    content = await file.read()
    max_size = _get_max_size(file.content_type)
    if len(content) > max_size:
        raise ValueError(f"Datei zu groß (max {max_size // (1024*1024)} MB)")

    upload_dir = Path(settings.UPLOAD_DIR) / tenant_slug
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_id = uuid_mod.uuid4().hex[:12]
    original_name = file.filename or "upload"
    stem = Path(original_name).stem
    suffix = Path(original_name).suffix

    width, height = None, None
    sizes = {}

    if file.content_type in IMAGE_MIME and file.content_type != "image/svg+xml":
        # Raster image: convert to WebP + thumbnails
        await file.seek(0)
        img = Image.open(file.file)
        width, height = img.size

        filename = f"{file_id}_{stem}.webp"
        filepath = upload_dir / filename
        img.save(str(filepath), "WEBP", quality=85)
        file_size = filepath.stat().st_size
        mime_out = "image/webp"

        for key, max_width in THUMBNAIL_SIZES.items():
            if width > max_width:
                ratio = max_width / width
                thumb = img.resize((max_width, int(height * ratio)), Image.LANCZOS)
                thumb_name = f"{file_id}_{stem}_{key}.webp"
                thumb_path = upload_dir / thumb_name
                thumb.save(str(thumb_path), "WEBP", quality=80)
                sizes[key] = {
                    "url": f"/uploads/{tenant_slug}/{thumb_name}",
                    "width": max_width,
                    "height": int(height * ratio),
                }
    elif file.content_type == "image/svg+xml":
        filename = f"{file_id}_{stem}.svg"
        filepath = upload_dir / filename
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)
        file_size = len(content)
        mime_out = "image/svg+xml"
    else:
        # Documents, videos: save as-is
        filename = f"{file_id}_{stem}{suffix}"
        filepath = upload_dir / filename
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)
        file_size = len(content)
        mime_out = file.content_type

    url = f"/uploads/{tenant_slug}/{filename}"

    media = CmsMedia(
        tenant_id=tenant_id,
        filename=filename,
        original_name=original_name,
        mime_type=mime_out,
        file_size=file_size,
        width=width,
        height=height,
        url=url,
        sizes=sizes,
        folder_id=folder_id,
        created_by=user_id,
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)
    return media


async def list_media(
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    category: str | None = None,
    search: str | None = None,
    folder_id: int | None = None,
    show_root_only: bool = False,
    mime_filter: str | None = None,
) -> tuple[list[CmsMedia], int]:
    query = select(CmsMedia).where(CmsMedia.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(CmsMedia).where(CmsMedia.tenant_id == tenant_id)

    if show_root_only:
        query = query.where(CmsMedia.folder_id.is_(None))
        count_query = count_query.where(CmsMedia.folder_id.is_(None))
    elif folder_id is not None:
        query = query.where(CmsMedia.folder_id == folder_id)
        count_query = count_query.where(CmsMedia.folder_id == folder_id)

    if category:
        query = query.where(CmsMedia.category == category)
        count_query = count_query.where(CmsMedia.category == category)
    if search:
        like = f"%{search}%"
        query = query.where(CmsMedia.original_name.ilike(like) | CmsMedia.alt.ilike(like))
        count_query = count_query.where(CmsMedia.original_name.ilike(like) | CmsMedia.alt.ilike(like))
    if mime_filter:
        if mime_filter == "image":
            query = query.where(CmsMedia.mime_type.like("image/%"))
            count_query = count_query.where(CmsMedia.mime_type.like("image/%"))
        elif mime_filter == "document":
            query = query.where(CmsMedia.mime_type.like("application/%"))
            count_query = count_query.where(CmsMedia.mime_type.like("application/%"))
        elif mime_filter == "video":
            query = query.where(CmsMedia.mime_type.like("video/%"))
            count_query = count_query.where(CmsMedia.mime_type.like("video/%"))

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(CmsMedia.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_media(media_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsMedia | None:
    result = await db.execute(
        select(CmsMedia).where(CmsMedia.id == media_id, CmsMedia.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()


async def update_media(media_id: int, tenant_id: uuid_mod.UUID, data: dict, db: AsyncSession) -> CmsMedia | None:
    media = await get_media(media_id, tenant_id, db)
    if not media:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(media, key, value)
    await db.flush()
    await db.refresh(media)
    return media


async def bulk_move(
    ids: list[int],
    folder_id: int | None,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> int:
    count = 0
    for media_id in ids:
        media = await get_media(media_id, tenant_id, db)
        if media:
            media.folder_id = folder_id
            count += 1
    await db.flush()
    return count


async def bulk_delete(
    ids: list[int],
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> int:
    count = 0
    for media_id in ids:
        if await delete_media(media_id, tenant_id, db):
            count += 1
    return count


async def bulk_tag(
    ids: list[int],
    tags: list[str],
    action: str,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> int:
    count = 0
    for media_id in ids:
        media = await get_media(media_id, tenant_id, db)
        if not media:
            continue
        current_tags = list(media.tags or [])
        if action == "add":
            for tag in tags:
                if tag not in current_tags:
                    current_tags.append(tag)
        elif action == "remove":
            current_tags = [t for t in current_tags if t not in tags]
        media.tags = current_tags
        count += 1
    await db.flush()
    return count


async def delete_media(media_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> bool:
    media = await get_media(media_id, tenant_id, db)
    if not media:
        return False
    # Delete files
    upload_dir = Path(settings.UPLOAD_DIR)
    main_file = upload_dir / media.url.lstrip("/uploads/")
    if main_file.exists():
        main_file.unlink()
    for size_info in (media.sizes or {}).values():
        thumb_file = upload_dir / size_info["url"].lstrip("/uploads/")
        if thumb_file.exists():
            thumb_file.unlink()
    await db.delete(media)
    return True
