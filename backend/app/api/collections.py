from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.collection import (
    BulkDeleteRequest, ReorderRequest,
    CollectionItemCreate, CollectionItemRead, CollectionItemUpdate,
    CollectionSchemaCreate, CollectionSchemaRead, CollectionSchemaUpdate,
    ImportExecuteRequest, ImportExecuteResponse, ImportPreviewResponse,
)
from app.services import collection_service
from app.services import collection_import_service
from app.services import collection_export_service
from app.services import schema_export_service
from app.services.translation_service import get_translations, update_translation, delete_translation
from app.services.webhook_service import dispatch_event

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("")
async def list_schemas(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schemas = await collection_service.list_schemas(user.tenant_id, db)
    result = []
    for s in schemas:
        count = await collection_service.count_items(s.collection_key, user.tenant_id, db)
        item = CollectionSchemaRead.model_validate(s).model_dump()
        item["item_count"] = count
        result.append(item)
    return result


@router.post("", response_model=CollectionSchemaRead, status_code=status.HTTP_201_CREATED)
async def create_schema(
    data: CollectionSchemaCreate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        schema = await collection_service.create_schema(user.tenant_id, data, db)
        return schema
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/schema/import")
async def import_schema(
    file: UploadFile,
    conflict: str = Query("fail", pattern="^(fail|overwrite)$"),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Kein Dateiname")
    content = await file.read()
    if len(content) > 1 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Datei zu groß (max 1 MB)")
    try:
        data = schema_export_service.parse_schema_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    key = data["collection_key"]
    existing = await collection_service.get_schema(key, user.tenant_id, db)

    if existing and conflict == "fail":
        raise HTTPException(status_code=409, detail=f"Collection '{key}' existiert bereits")

    schema_data = CollectionSchemaCreate(
        collection_key=key,
        label=data["label"],
        label_singular=data["label_singular"],
        icon=data.get("icon", "Database"),
        fields=data.get("fields", []),
        title_field=data.get("title_field", "title"),
        slug_field=data.get("slug_field"),
        sort_field=data.get("sort_field", "sort_order"),
    )

    if existing and conflict == "overwrite":
        update_data = CollectionSchemaUpdate(
            label=schema_data.label,
            label_singular=schema_data.label_singular,
            icon=schema_data.icon,
            fields=schema_data.fields,
            title_field=schema_data.title_field,
            slug_field=schema_data.slug_field,
            sort_field=schema_data.sort_field,
        )
        await collection_service.update_schema(key, user.tenant_id, update_data, db)
        return {"status": "updated", "collection_key": key}

    try:
        await collection_service.create_schema(user.tenant_id, schema_data, db)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"status": "created", "collection_key": key}


@router.put("/{key}", response_model=CollectionSchemaRead)
@router.patch("/{key}", response_model=CollectionSchemaRead)
async def update_schema(
    key: str,
    data: CollectionSchemaUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.update_schema(key, user.tenant_id, data, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    return schema


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(
    key: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await collection_service.delete_schema(key, user.tenant_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Collection not found")


@router.get("/{key}/schema", response_model=CollectionSchemaRead)
async def get_schema(
    key: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    return schema


@router.get("/{key}/schema/export")
async def export_schema_file(
    key: str,
    format: str = Query("yaml", pattern="^(yaml|json)$"),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")
    if format == "json":
        content = schema_export_service.export_schema_json(schema)
        media_type = "application/json"
        filename = f"{key}-schema.json"
    else:
        content = schema_export_service.export_schema_yaml(schema)
        media_type = "text/yaml"
        filename = f"{key}-schema.yaml"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{key}/items/export")
async def export_items(
    key: str,
    format: str = Query("csv", pattern="^(csv|json)$"),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")
    items, _ = await collection_service.list_items(
        key, user.tenant_id, db, limit=10000, offset=0,
    )
    filename = f"{key}.{format}"
    if format == "json":
        content = collection_export_service.export_json(items, schema)
        media_type = "application/json"
    else:
        content = collection_export_service.export_csv(items, schema)
        media_type = "text/csv"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{key}/items/import/preview", response_model=ImportPreviewResponse)
async def import_preview(
    key: str,
    file: UploadFile,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Kein Dateiname")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Datei zu groß (max 10 MB)")
    try:
        result = collection_import_service.preview_import(content, file.filename)
    except (ValueError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.post("/{key}/items/import/execute", response_model=ImportExecuteResponse)
async def import_execute(
    key: str,
    body: ImportExecuteRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")
    result = await collection_import_service.execute_import(
        collection_key=key,
        tenant_id=user.tenant_id,
        db=db,
        rows=body.rows,
        field_mapping=body.field_mapping,
        title_column=body.title_column,
        status=body.status,
        conflict=body.conflict,
        slug_field=schema.slug_field,
    )
    return result


@router.get("/{key}/items")
async def list_items(
    key: str,
    search: str | None = None,
    sort_by: str = "sort_order",
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status", pattern="^(draft|published)$"),
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    items, total = await collection_service.list_items(
        key, user.tenant_id, db, search, sort_by, sort_dir, limit, offset, status=status_filter
    )
    return {
        "items": [CollectionItemRead.model_validate(i) for i in items],
        "total": total,
    }


@router.get("/{key}/items/trash")
async def list_trash_items(
    key: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    items = await collection_service.list_trash_items(key, user.tenant_id, db)
    trash_count = len(items)
    return {
        "items": [CollectionItemRead.model_validate(i) for i in items],
        "total": trash_count,
    }


@router.post("/{key}/items/{item_id}/restore", response_model=CollectionItemRead)
async def restore_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.restore_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item nicht im Papierkorb gefunden")
    await dispatch_event("collection.item_restored", {"id": item.id, "collection": key}, user.tenant_id, db)
    return item


@router.delete("/{key}/items/{item_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await collection_service.permanent_delete_item(item_id, key, user.tenant_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item nicht im Papierkorb gefunden")
    await dispatch_event("collection.item_permanently_deleted", {"id": item_id, "collection": key}, user.tenant_id, db)


@router.get("/{key}/items/trash-count")
async def trash_count(
    key: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await collection_service.count_trash_items(key, user.tenant_id, db)
    return {"count": count}


@router.put("/{key}/items/reorder")
async def reorder_items(
    key: str,
    body: ReorderRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")
    updated = await collection_service.reorder_items(body.item_ids, key, user.tenant_id, db)
    return {"updated": updated}


@router.delete("/{key}/items/bulk")
async def bulk_delete_items(
    key: str,
    body: BulkDeleteRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    deleted_count = await collection_service.bulk_delete_items(body.ids, key, user.tenant_id, db)
    if deleted_count > 0:
        await dispatch_event(
            "collection.items_bulk_deleted",
            {"ids": body.ids, "collection": key, "deleted_count": deleted_count},
            user.tenant_id, db,
        )
    return {"deleted": deleted_count}


@router.get("/{key}/items/{item_id}", response_model=CollectionItemRead)
async def get_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.get_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/{key}/items", response_model=CollectionItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    key: str,
    data: CollectionItemCreate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    schema = await collection_service.get_schema(key, user.tenant_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Collection not found")
    item = await collection_service.create_item(key, user.tenant_id, data, db)
    await dispatch_event("collection.item_created", {"id": item.id, "collection": key}, user.tenant_id, db)
    return item


@router.put("/{key}/items/{item_id}", response_model=CollectionItemRead)
@router.patch("/{key}/items/{item_id}", response_model=CollectionItemRead)
async def update_item(
    key: str,
    item_id: int,
    data: CollectionItemUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.update_item(item_id, key, user.tenant_id, data, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await dispatch_event("collection.item_updated", {"id": item.id, "collection": key}, user.tenant_id, db)
    return item


@router.post("/{key}/items/{item_id}/publish", response_model=CollectionItemRead)
async def publish_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.publish_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await dispatch_event("collection.item_published", {"id": item.id, "collection": key}, user.tenant_id, db)
    return item


@router.post("/{key}/items/{item_id}/unpublish", response_model=CollectionItemRead)
async def unpublish_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.unpublish_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await dispatch_event("collection.item_unpublished", {"id": item.id, "collection": key}, user.tenant_id, db)
    return item


@router.delete("/{key}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await collection_service.delete_item(item_id, key, user.tenant_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    await dispatch_event("collection.item_deleted", {"id": item_id, "collection": key}, user.tenant_id, db)


# ---------------------------------------------------------------------------
# Translation CRUD (i18n)
# ---------------------------------------------------------------------------

class CollectionTranslationUpdate(BaseModel):
    title: str | None = None
    data: dict | None = None


@router.get("/{key}/items/{item_id}/translations")
async def get_item_translations(
    key: str,
    item_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.get_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return get_translations(item)


@router.put("/{key}/items/{item_id}/translations/{locale}")
async def update_item_translation(
    key: str,
    item_id: int,
    locale: str,
    body: CollectionTranslationUpdate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.get_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No translation data provided")
    translations = await update_translation(item, locale, data, db)
    return {"locale": locale, "translations": translations}


@router.delete("/{key}/items/{item_id}/translations/{locale}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_translation(
    key: str,
    item_id: int,
    locale: str,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await collection_service.get_item(item_id, key, user.tenant_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    removed = await delete_translation(item, locale, db)
    if not removed:
        raise HTTPException(status_code=404, detail=f"No translation for locale '{locale}'")
