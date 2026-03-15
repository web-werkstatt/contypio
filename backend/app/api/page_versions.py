from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.page_version import PageVersionDetail, PageVersionRead
from app.services import page_service
from app.services.page_version_service import create_version_snapshot, get_version, list_versions

router = APIRouter(prefix="/api/pages/{page_id}/versions", tags=["page-versions"])


@router.get("", response_model=list[PageVersionRead])
async def get_page_versions(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await page_service.get_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    versions = await list_versions(page_id, user.tenant_id, db)
    return [PageVersionRead.model_validate(v) for v in versions]


@router.get("/{version_id}", response_model=PageVersionDetail)
async def get_page_version(
    page_id: int,
    version_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    version = await get_version(version_id, user.tenant_id, db)
    if not version or version.page_id != page_id:
        raise HTTPException(status_code=404, detail="Version not found")
    return PageVersionDetail.model_validate(version)


@router.post("/{version_id}/restore")
async def restore_page_version(
    page_id: int,
    version_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore a page to a previous version. Creates a new version snapshot first."""
    page = await page_service.get_page(page_id, user.tenant_id, db)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    version = await get_version(version_id, user.tenant_id, db)
    if not version or version.page_id != page_id:
        raise HTTPException(status_code=404, detail="Version not found")

    # Snapshot current state before restoring
    await create_version_snapshot(page, user.id, db, f"Vor Wiederherstellung von Version {version.version_number}")

    # Apply version data
    page.title = version.title
    page.slug = version.slug
    page.seo = version.seo or {}
    page.hero = version.hero or {}
    page.sections = version.sections or []

    await db.commit()
    await db.refresh(page)
    return {"ok": True, "restored_version": version.version_number}
