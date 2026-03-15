"""API routes for the Page Assembly Wizard."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.services.page_presets import generate_sections, get_page_types, get_presets_for_type
from app.services import page_service
from app.schemas.page import PageCreate, PageRead

router = APIRouter(tags=["page-assembly"])


@router.get("/api/page-types")
async def list_page_types(user: CmsUser = Depends(get_current_user)):
    return get_page_types()


@router.get("/api/page-types/{page_type_key}/presets")
async def list_presets(page_type_key: str, user: CmsUser = Depends(get_current_user)):
    return get_presets_for_type(page_type_key)


class FromPresetRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    page_type: str = "content"
    preset_key: str = Field(min_length=3, description="Format: 'type:style', e.g. 'homepage:classic'")
    metadata: dict = Field(default_factory=dict, description="title, brand, target_audience, tone")


@router.post("/api/pages/from-preset", response_model=PageRead, status_code=status.HTTP_201_CREATED)
async def create_from_preset(
    data: FromPresetRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        sections = generate_sections(data.preset_key, {
            "title": data.title,
            "brand": data.metadata.get("brand", data.title),
            "target_audience": data.metadata.get("target_audience", ""),
            "tone": data.metadata.get("tone", ""),
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    page_data = PageCreate(
        title=data.title,
        slug=data.slug,
        path=f"/{data.slug}",
        page_type=data.page_type,
        sections=sections,
    )
    return await page_service.create_page(user.tenant_id, page_data, user.id, db)
