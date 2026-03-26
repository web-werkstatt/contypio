import uuid as uuid_mod
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.collection import CmsCollection, CmsCollectionSchema
from app.schemas.collection import CollectionItemCreate, CollectionItemUpdate, CollectionSchemaCreate, CollectionSchemaUpdate
from app.utils.slugify import slugify


async def list_schemas(tenant_id: uuid_mod.UUID, db: AsyncSession) -> list[CmsCollectionSchema]:
    result = await db.execute(
        select(CmsCollectionSchema)
        .where(CmsCollectionSchema.tenant_id == tenant_id)
        .order_by(CmsCollectionSchema.label)
    )
    return list(result.scalars().all())


async def get_schema(collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsCollectionSchema | None:
    result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.collection_key == collection_key,
        )
    )
    return result.scalar_one_or_none()


async def count_items(collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(CmsCollection.id)).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.deleted_at.is_(None),
        )
    )
    return result.scalar_one()


async def list_items(
    collection_key: str,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
    search: str | None = None,
    sort_by: str = "sort_order",
    sort_dir: str = "asc",
    limit: int = 100,
    offset: int = 0,
    status: str | None = None,
) -> tuple[list[CmsCollection], int]:
    base = select(CmsCollection).where(
        CmsCollection.tenant_id == tenant_id,
        CmsCollection.collection_key == collection_key,
        CmsCollection.deleted_at.is_(None),
    )
    if search:
        base = base.where(CmsCollection.title.ilike(f"%{search}%"))
    if status:
        base = base.where(CmsCollection.status == status)

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    order_col = getattr(CmsCollection, sort_by, CmsCollection.sort_order)
    if sort_dir == "desc":
        order_col = order_col.desc()
    query = base.order_by(order_col, CmsCollection.title).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_item(item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsCollection | None:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.id == item_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def _unique_slug(
    base_slug: str, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> str:
    """Ensure slug is unique within collection. Appends -2, -3, ... on conflict."""
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(
            select(CmsCollection.id).where(
                CmsCollection.tenant_id == tenant_id,
                CmsCollection.collection_key == collection_key,
                CmsCollection.slug == slug,
            ).limit(1)
        )
        if not existing.scalar_one_or_none():
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"


async def create_item(
    collection_key: str, tenant_id: uuid_mod.UUID, data: CollectionItemCreate, db: AsyncSession
) -> CmsCollection:
    # Auto-generate slug from title if not provided
    item_slug = data.slug
    if not item_slug:
        schema = await get_schema(collection_key, tenant_id, db)
        if schema and schema.slug_field:
            item_slug = await _unique_slug(slugify(data.title), collection_key, tenant_id, db)

    item = CmsCollection(
        tenant_id=tenant_id,
        collection_key=collection_key,
        title=data.title,
        slug=item_slug,
        data=data.data,
        status=data.status,
        sort_order=data.sort_order,
        image_id=data.image_id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_item(
    item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, data: CollectionItemUpdate, db: AsyncSession
) -> CmsCollection | None:
    item = await get_item(item_id, collection_key, tenant_id, db)
    if not item:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.flush()
    await db.refresh(item)
    return item


async def delete_item(item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> bool:
    item = await get_item(item_id, collection_key, tenant_id, db)
    if not item:
        return False
    item.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    return True


async def bulk_delete_items(
    ids: list[int], collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession
) -> int:
    result = await db.execute(
        update(CmsCollection)
        .where(
            CmsCollection.id.in_(ids),
            CmsCollection.collection_key == collection_key,
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.deleted_at.is_(None),
        )
        .values(deleted_at=datetime.now(timezone.utc))
    )
    return result.rowcount


async def list_trash_items(
    collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> list[CmsCollection]:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.deleted_at.is_not(None),
        ).order_by(CmsCollection.deleted_at.desc())
    )
    return list(result.scalars().all())


async def count_trash_items(
    collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> int:
    result = await db.execute(
        select(func.count(CmsCollection.id)).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.deleted_at.is_not(None),
        )
    )
    return result.scalar_one()


async def restore_item(
    item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> CmsCollection | None:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.id == item_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.deleted_at.is_not(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return None
    item.deleted_at = None
    await db.flush()
    await db.refresh(item)
    return item


async def permanent_delete_item(
    item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> bool:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.id == item_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.deleted_at.is_not(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return False
    await db.delete(item)
    return True


async def reorder_items(
    item_ids: list[int], collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> int:
    """Update sort_order for items based on their position in the list."""
    updated = 0
    for index, item_id in enumerate(item_ids):
        result = await db.execute(
            update(CmsCollection)
            .where(
                CmsCollection.id == item_id,
                CmsCollection.collection_key == collection_key,
                CmsCollection.tenant_id == tenant_id,
                CmsCollection.deleted_at.is_(None),
            )
            .values(sort_order=index)
        )
        updated += result.rowcount
    await db.flush()
    return updated


async def publish_item(item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsCollection | None:
    item = await get_item(item_id, collection_key, tenant_id, db)
    if not item:
        return None
    item.status = "published"
    await db.flush()
    await db.refresh(item)
    return item


async def unpublish_item(item_id: int, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsCollection | None:
    item = await get_item(item_id, collection_key, tenant_id, db)
    if not item:
        return None
    item.status = "draft"
    await db.flush()
    await db.refresh(item)
    return item


async def create_schema(
    tenant_id: uuid_mod.UUID, data: CollectionSchemaCreate, db: AsyncSession
) -> CmsCollectionSchema:
    existing = await get_schema(data.collection_key, tenant_id, db)
    if existing:
        raise ValueError(f"Collection '{data.collection_key}' existiert bereits")
    schema = CmsCollectionSchema(
        tenant_id=tenant_id,
        collection_key=data.collection_key,
        label=data.label,
        label_singular=data.label_singular,
        icon=data.icon,
        fields=[f.model_dump() for f in data.fields],
        title_field=data.title_field,
        slug_field=data.slug_field,
        sort_field=data.sort_field,
        singleton=data.singleton,
    )
    db.add(schema)
    await db.flush()
    await db.refresh(schema)
    return schema


async def update_schema(
    collection_key: str, tenant_id: uuid_mod.UUID, data: CollectionSchemaUpdate, db: AsyncSession
) -> CmsCollectionSchema | None:
    schema = await get_schema(collection_key, tenant_id, db)
    if not schema:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "fields" and value is not None:
            setattr(schema, key, [f.model_dump() if hasattr(f, "model_dump") else f for f in value])
        else:
            setattr(schema, key, value)
    await db.flush()
    await db.refresh(schema)
    return schema


async def get_singleton_item(
    collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> CmsCollection | None:
    """Get the single item of a singleton collection."""
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.deleted_at.is_(None),
        ).limit(1)
    )
    return result.scalar_one_or_none()


async def upsert_singleton_item(
    collection_key: str, tenant_id: uuid_mod.UUID, data: dict, db: AsyncSession,
) -> CmsCollection:
    """Create or update the single item of a singleton collection."""
    item = await get_singleton_item(collection_key, tenant_id, db)
    if item:
        item.data = data
        item.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(item)
        return item
    schema = await get_schema(collection_key, tenant_id, db)
    label = schema.label if schema else collection_key
    item = CmsCollection(
        tenant_id=tenant_id,
        collection_key=collection_key,
        title=label,
        slug=collection_key,
        data=data,
        status="published",
        sort_order=0,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def delete_schema(collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> bool:
    schema = await get_schema(collection_key, tenant_id, db)
    if not schema:
        return False
    # Delete all items first
    items_result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
        )
    )
    for item in items_result.scalars().all():
        await db.delete(item)
    await db.delete(schema)
    return True
