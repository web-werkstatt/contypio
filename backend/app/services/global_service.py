import uuid as uuid_mod

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.global_config import CmsGlobal


async def list_globals(tenant_id: uuid_mod.UUID, db: AsyncSession) -> list[CmsGlobal]:
    result = await db.execute(
        select(CmsGlobal)
        .where(CmsGlobal.tenant_id == tenant_id)
        .order_by(CmsGlobal.label)
    )
    return list(result.scalars().all())


async def get_global(slug: str, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsGlobal | None:
    result = await db.execute(
        select(CmsGlobal).where(
            CmsGlobal.tenant_id == tenant_id,
            CmsGlobal.slug == slug,
        )
    )
    return result.scalar_one_or_none()


async def update_global(
    slug: str, tenant_id: uuid_mod.UUID, data: dict, user_id: uuid_mod.UUID, db: AsyncSession
) -> CmsGlobal | None:
    item = await get_global(slug, tenant_id, db)
    if not item:
        return None
    item.data = data
    item.updated_by = user_id
    await db.flush()
    await db.refresh(item)
    return item
