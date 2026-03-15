"""Public schema endpoints for collection introspection and SDK codegen.

GET /content/schema              — All collection schemas
GET /content/schema/{key}        — Single collection schema

Public (no auth required). Cache-Control: public, max-age=300.
Spec: docs/api-roadmap-v1.md Chapter 5.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.delivery.cache_headers import cached_json_response
from app.delivery.tenant_resolver import get_delivery_tenant
from app.models.collection import CmsCollectionSchema
from app.models.tenant import CmsTenant

router = APIRouter(prefix="/content/schema", tags=["Content Delivery API"])


def _serialize_schema(schema: CmsCollectionSchema) -> dict:
    """Serialize a collection schema for public consumption."""
    return {
        "collection_key": schema.collection_key,
        "label": schema.label,
        "label_singular": schema.label_singular,
        "icon": schema.icon,
        "fields": schema.fields or [],
        "slug_field": schema.slug_field,
        "title_field": schema.title_field,
        "sort_field": schema.sort_field,
    }


@router.get(
    "",
    summary="List all collection schemas",
    description="Returns all collection schemas for this tenant. "
    "Useful for SDK type generation and content modeling tools. "
    "Public endpoint, no authentication required.",
)
async def list_schemas(
    request: Request,
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsCollectionSchema)
        .where(CmsCollectionSchema.tenant_id == tenant.id)
        .order_by(CmsCollectionSchema.collection_key)
    )
    schemas = result.scalars().all()
    items = [_serialize_schema(s) for s in schemas]
    return cached_json_response(
        {"items": items, "total": len(items)},
        request,
        "schema",
    )


@router.get(
    "/{collection_key}",
    summary="Get collection schema",
    description="Returns the schema for a single collection including field definitions, "
    "types, and validations. Public endpoint for SDK codegen tooling.",
)
async def get_schema(
    collection_key: str,
    request: Request,
    tenant: CmsTenant = Depends(get_delivery_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant.id,
            CmsCollectionSchema.collection_key == collection_key,
        )
    )
    schema = result.scalar_one_or_none()
    if not schema:
        raise HTTPException(status_code=404, detail="Collection schema not found")
    return cached_json_response(
        _serialize_schema(schema),
        request,
        "schema",
    )
