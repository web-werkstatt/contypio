from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.tenant import CmsTenant
from app.schemas.blocks import BLOCK_TYPE_REGISTRY
from app.services.layout_presets import get_presets_list
from app.services.module_registry import is_module_active

router = APIRouter(tags=["config"])

# Block-Typen die das "advanced_blocks" Modul erfordern (L24)
ADVANCED_BLOCK_KEYS = {
    "video", "embed", "map", "form", "tabs", "table",
    "testimonials", "team", "logoSlider", "counter", "socialLinks",
}

# Basis-Blocks: immer verfuegbar (alle Editionen)
# spacer ist bewusst kein Advanced Block


@router.get("/api/block-types")
async def get_block_types(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.get(CmsTenant, user.tenant_id)
    has_advanced = is_module_active(tenant, "advanced_blocks") if tenant else False

    return [
        {
            "type_key": key,
            "label": info["label"],
            "fields": list(info["schema"].model_fields.keys()),
            "gated": key in ADVANCED_BLOCK_KEYS and not has_advanced,
        }
        for key, info in BLOCK_TYPE_REGISTRY.items()
    ]


@router.get("/api/layout-presets")
async def get_layout_presets():
    return get_presets_list()
