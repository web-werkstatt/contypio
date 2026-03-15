"""AI field content generation endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.config import settings
from app.core.database import get_db
from app.services import collection_service
from app.services.ai_field_service import generate_field_content

router = APIRouter(prefix="/api/ai", tags=["ai"])


class GenerateFieldRequest(BaseModel):
    collection_key: str
    field_name: str
    item_data: dict


@router.post("/generate-field")
async def generate_field(
    body: GenerateFieldRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(body.collection_key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")

    # Find field and its AI config
    target_field = None
    for f in (schema.fields or []):
        if f.get("name") == body.field_name:
            target_field = f
            break

    if not target_field:
        raise HTTPException(status_code=404, detail=f"Feld '{body.field_name}' nicht gefunden")

    ai_config = target_field.get("config", {}).get("ai")
    if not ai_config:
        raise HTTPException(status_code=400, detail="Feld hat keine KI-Konfiguration")

    try:
        content = await generate_field_content(ai_config, body.item_data, body.field_name)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"content": content, "field_name": body.field_name}


@router.get("/status")
async def ai_status():
    """Check if AI is configured."""
    return {
        "configured": bool(settings.AI_ENDPOINT_URL),
        "model": settings.AI_MODEL if settings.AI_ENDPOINT_URL else None,
    }
