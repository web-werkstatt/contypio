from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.field_type import CmsFieldTypePreset
from app.schemas.field_type import FieldTypePresetRead

router = APIRouter(prefix="/api/field-type-presets", tags=["field-type-presets"])


@router.get("", response_model=list[FieldTypePresetRead])
async def list_presets(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsFieldTypePreset)
        .where(CmsFieldTypePreset.tenant_id == user.tenant_id)
        .order_by(CmsFieldTypePreset.sort_order)
    )
    return result.scalars().all()
