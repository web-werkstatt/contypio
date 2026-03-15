from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.global_config import GlobalRead, GlobalUpdate
from app.services import global_service
from app.services.webhook_service import dispatch_event

router = APIRouter(prefix="/api/globals", tags=["globals"])


@router.get("")
async def list_globals(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items = await global_service.list_globals(user.tenant_id, db)
    return [GlobalRead.model_validate(g) for g in items]


@router.get("/{slug}", response_model=GlobalRead)
async def get_global(
    slug: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await global_service.get_global(slug, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Global not found")
    return item


@router.put("/{slug}", response_model=GlobalRead)
@router.patch("/{slug}", response_model=GlobalRead)
async def update_global(
    slug: str,
    body: GlobalUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await global_service.update_global(slug, user.tenant_id, body.data, user.id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Global not found")
    await dispatch_event("global.updated", {"slug": slug}, user.tenant_id, db)
    return item
