"""Content Templates API: CRUD + Quality-Check + AI Generator."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import CmsUser
from app.core.config import settings
from app.core.database import get_db
from app.models.content_template import CmsContentTemplate
from app.services.content_quality import evaluate_text
from app.services.content_templates_data import (
    CHANNEL_LABELS,
    CHANNEL_TIPS,
    SERVICE_LABELS,
    TEMPLATES,
)
from app.services.edition_gate import require_module

logger = logging.getLogger("cms.ct")

router = APIRouter(prefix="/api/content-templates", tags=["content-templates"])


# --- Schemas ---

class ServiceResponse(BaseModel):
    key: str
    name: str


class ChannelResponse(BaseModel):
    key: str
    label: str


class TemplateResponse(BaseModel):
    service: str
    service_name: str
    channel: str
    content: str
    tips: dict[str, str]
    id: str | None = None
    is_custom: bool = False


class QualityCheckRequest(BaseModel):
    text: str = Field(min_length=10, max_length=50000)
    channel: str | None = None


class TemplateCreate(BaseModel):
    service_key: str = Field(min_length=1, max_length=50)
    service_name: str = Field(min_length=1, max_length=100)
    channel: str = Field(min_length=1, max_length=20)
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)


class TemplateUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    service_name: str | None = Field(None, min_length=1, max_length=100)


class GenerateRequest(BaseModel):
    channel: str = Field(min_length=1, max_length=20)
    service: str = Field(min_length=1, max_length=50)
    keywords: str = ""
    target_audience: str = ""
    notes: str = ""
    num_variants: int = Field(default=1, ge=1, le=3)
    refine_instruction: str = ""


class StyleGuideUpdate(BaseModel):
    style_guide: str = Field(min_length=1, max_length=10000)


# --- Endpoints ---

@router.get("/services", response_model=list[ServiceResponse])
async def list_services(
    user: CmsUser = Depends(require_module("content_templates")),
):
    return [ServiceResponse(key=k, name=v) for k, v in SERVICE_LABELS.items()]


@router.get("/channels", response_model=list[ChannelResponse])
async def list_channels(
    user: CmsUser = Depends(require_module("content_templates")),
):
    return [ChannelResponse(key=k, label=v) for k, v in CHANNEL_LABELS.items()]


@router.get("/all")
async def get_all_templates(
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    # Default-Templates
    defaults = {}
    for svc, channels in TEMPLATES.items():
        defaults[svc] = {ch: content for ch, content in channels.items()}

    # Custom-Templates des Tenants
    result = await db.execute(
        select(CmsContentTemplate).where(CmsContentTemplate.tenant_id == user.tenant_id)
    )
    custom = [
        {
            "id": str(t.id),
            "service_key": t.service_key,
            "service_name": t.service_name,
            "channel": t.channel,
            "title": t.title,
            "content": t.content,
            "ai_generated": t.ai_generated,
        }
        for t in result.scalars().all()
    ]

    return {"defaults": defaults, "custom": custom, "services": SERVICE_LABELS, "channels": CHANNEL_LABELS}


@router.get("/{service}/{channel}", response_model=TemplateResponse)
async def get_template(
    service: str,
    channel: str,
    user: CmsUser = Depends(require_module("content_templates")),
):
    if service not in TEMPLATES or channel not in TEMPLATES.get(service, {}):
        raise HTTPException(404, "Template nicht gefunden")
    return TemplateResponse(
        service=service,
        service_name=SERVICE_LABELS[service],
        channel=channel,
        content=TEMPLATES[service][channel],
        tips=CHANNEL_TIPS.get(channel, {}),
    )


@router.post("/quality-check")
async def quality_check(
    body: QualityCheckRequest,
    user: CmsUser = Depends(require_module("content_templates")),
):
    return evaluate_text(body.text, body.channel)


@router.get("/style-guide")
async def get_style_guide(
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.content_generator import DEFAULT_STYLE_GUIDE
    result = await db.execute(
        select(CmsContentTemplate).where(
            CmsContentTemplate.tenant_id == user.tenant_id,
            CmsContentTemplate.service_key == "__style_guide__",
        )
    )
    row = result.scalar_one_or_none()
    return {
        "style_guide": row.content if row else DEFAULT_STYLE_GUIDE,
        "is_custom": row is not None,
    }


@router.put("/style-guide")
async def update_style_guide(
    body: StyleGuideUpdate,
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsContentTemplate).where(
            CmsContentTemplate.tenant_id == user.tenant_id,
            CmsContentTemplate.service_key == "__style_guide__",
        )
    )
    row = result.scalar_one_or_none()
    if row:
        row.content = body.style_guide
    else:
        row = CmsContentTemplate(
            tenant_id=user.tenant_id,
            service_key="__style_guide__",
            service_name="Style Guide",
            channel="system",
            title="Style Guide",
            content=body.style_guide,
        )
        db.add(row)
    await db.commit()
    return {"message": "Style-Guide gespeichert"}


@router.post("/generate")
async def generate_ai_content(
    body: GenerateRequest,
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    if not settings.AI_ENDPOINT_URL:
        raise HTTPException(403, "KI nicht konfiguriert. Bitte AI_ENDPOINT_URL in den Einstellungen setzen.")

    from app.services.content_generator import generate_variants

    service_name = SERVICE_LABELS.get(body.service, body.service)
    channel_label = CHANNEL_LABELS.get(body.channel, body.channel)

    sg_result = await db.execute(
        select(CmsContentTemplate).where(
            CmsContentTemplate.tenant_id == user.tenant_id,
            CmsContentTemplate.service_key == "__style_guide__",
        )
    )
    sg_row = sg_result.scalar_one_or_none()
    style_guide = sg_row.content if sg_row else ""

    notes = body.notes
    if body.refine_instruction:
        notes = f"{notes}\n\nWICHTIG: {body.refine_instruction}" if notes else body.refine_instruction

    try:
        variants = await generate_variants(
            service_name=service_name,
            channel=body.channel,
            channel_label=channel_label,
            keywords=body.keywords,
            target_audience=body.target_audience,
            notes=notes,
            style_guide=style_guide,
            num_variants=body.num_variants,
        )
        return {"variants": variants, "style_guide_used": bool(sg_row)}
    except ValueError as e:
        raise HTTPException(502, str(e))


@router.post("")
async def create_template(
    body: TemplateCreate,
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    template = CmsContentTemplate(
        tenant_id=user.tenant_id,
        service_key=body.service_key,
        service_name=body.service_name,
        channel=body.channel,
        title=body.title,
        content=body.content,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return {"id": str(template.id), "message": "Template erstellt"}


@router.put("/{template_id}")
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsContentTemplate).where(
            CmsContentTemplate.id == template_id,
            CmsContentTemplate.tenant_id == user.tenant_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template nicht gefunden")
    if template.is_default:
        raise HTTPException(403, "Default-Templates können nicht bearbeitet werden")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(template, field, value)
    await db.commit()
    return {"message": "Template aktualisiert"}


@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID,
    user: CmsUser = Depends(require_module("content_templates")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsContentTemplate).where(
            CmsContentTemplate.id == template_id,
            CmsContentTemplate.tenant_id == user.tenant_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template nicht gefunden")
    if template.is_default:
        raise HTTPException(403, "Default-Templates können nicht gelöscht werden")
    await db.delete(template)
    await db.commit()
    return {"message": "Template gelöscht"}
