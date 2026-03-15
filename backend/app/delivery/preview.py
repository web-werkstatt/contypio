"""Preview endpoint: serves draft pages with resolved media for iframe preview."""

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.delivery.resolve import (
    build_media_cache,
    collect_image_ids,
    resolve_dynamic_blocks,
    resolve_sections,
)
from app.models.page import CmsPage

router = APIRouter(prefix="/api/preview", tags=["preview"])


async def _resolve_full(sections: list[dict], tenant_id, db: AsyncSession) -> list[dict]:
    """Resolve dynamic blocks and media references for a list of sections."""
    sections = await resolve_dynamic_blocks(sections, tenant_id=tenant_id, db=db)
    image_ids = await collect_image_ids(sections)
    media_cache = await build_media_cache(image_ids, tenant_id, db)
    return resolve_sections(sections, media_cache)


@router.get("/{page_id}")
async def preview_page(
    page_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return full page data (including drafts) for authenticated preview."""
    result = await db.execute(
        select(CmsPage).where(CmsPage.id == page_id, CmsPage.tenant_id == user.tenant_id)
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    resolved = await _resolve_full(page.sections or [], user.tenant_id, db)

    return {
        "id": page.id,
        "title": page.title,
        "slug": page.slug,
        "path": page.path,
        "page_type": page.page_type,
        "status": page.status,
        "seo": page.seo or {},
        "hero": page.hero or {},
        "sections": resolved,
    }


class LivePreviewPayload(BaseModel):
    """Sections sent from the editor for live preview resolution."""
    sections: list[dict]


@router.post("/{page_id}/resolve")
async def resolve_preview_sections(
    page_id: int,
    payload: LivePreviewPayload = Body(...),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resolve media and dynamic blocks for in-memory sections (not yet saved).

    Used by the live preview to resolve imageIds and dynamic data blocks
    without requiring the editor to save the page first.
    """
    # Verify user has access to the page
    result = await db.execute(
        select(CmsPage.id).where(CmsPage.id == page_id, CmsPage.tenant_id == user.tenant_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Page not found")

    resolved = await _resolve_full(payload.sections, user.tenant_id, db)
    return {"sections": resolved}
