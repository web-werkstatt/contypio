"""Delivery endpoints for locale information."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.content_i18n import PAGE_TRANSLATABLE_FIELDS, compute_completeness
from app.core.database import get_db
from app.delivery.tenant_resolver import get_delivery_tenant
from app.models.page import CmsPage
from app.models.tenant import CmsTenant

router = APIRouter(prefix="/content", tags=["Content Delivery API"])


@router.get("/locales", summary="List available locales", description="Returns all configured locales for this tenant.")
async def list_locales(
    tenant: CmsTenant = Depends(get_delivery_tenant),
):
    return {
        "locales": tenant.locales or [],
        "default": tenant.default_language,
    }


@router.get("/pages/{slug}/locales", summary="Page locale variants", description="Returns available locale variants with translation completeness scores.")
async def page_locales(
    slug: str,
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsPage).where(
            CmsPage.tenant_id == tenant.id,
            CmsPage.slug == slug,
            CmsPage.status == "published",
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    translations = page.translations or {}
    tenant_locales = tenant.locales or []

    locales = []
    # Default locale is always complete (content in main columns)
    locales.append({
        "locale": tenant.default_language,
        "completeness": 1.0,
    })

    for loc in tenant_locales:
        if loc == tenant.default_language:
            continue
        score = compute_completeness(translations, PAGE_TRANSLATABLE_FIELDS, loc)
        locales.append({
            "locale": loc,
            "completeness": score,
        })

    return {"locales": locales}
