import uuid as uuid_mod
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import CmsPage
from app.schemas.page import PageCreate, PageTreeItem, PageUpdate
from app.utils.slugify import slugify


async def list_pages(
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
    status: str | None = None,
    page_type: str | None = None,
) -> list[CmsPage]:
    query = select(CmsPage).where(CmsPage.tenant_id == tenant_id)
    if status:
        query = query.where(CmsPage.status == status)
    if page_type:
        query = query.where(CmsPage.page_type == page_type)
    query = query.order_by(CmsPage.sort_order, CmsPage.title)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_tree(tenant_id: uuid_mod.UUID, db: AsyncSession) -> list[PageTreeItem]:
    pages = await list_pages(tenant_id, db)
    page_map: dict[int, dict] = {}
    roots: list[dict] = []

    for p in pages:
        node = {
            "id": p.id, "title": p.title, "slug": p.slug, "path": p.path,
            "status": p.status, "page_type": p.page_type, "sort_order": p.sort_order,
            "updated_at": p.updated_at,
            "children": [],
        }
        page_map[p.id] = node

    for p in pages:
        node = page_map[p.id]
        if p.parent_id and p.parent_id in page_map:
            page_map[p.parent_id]["children"].append(node)
        else:
            roots.append(node)

    return [PageTreeItem(**r) for r in roots]


async def get_page(page_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsPage | None:
    result = await db.execute(
        select(CmsPage).where(CmsPage.id == page_id, CmsPage.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()


async def _unique_page_slug(
    base_slug: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> str:
    """Ensure slug is unique among pages. Appends -2, -3, ... on conflict."""
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(
            select(CmsPage.id).where(
                CmsPage.tenant_id == tenant_id,
                CmsPage.slug == slug,
            ).limit(1)
        )
        if not existing.scalar_one_or_none():
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"


async def create_page(
    tenant_id: uuid_mod.UUID, data: PageCreate, user_id: uuid_mod.UUID, db: AsyncSession
) -> CmsPage:
    # Auto-generate slug from title if not provided
    page_slug = data.slug
    if not page_slug:
        page_slug = await _unique_page_slug(slugify(data.title), tenant_id, db)

    # Build path from parent
    page_path = data.path
    if not page_path and data.parent_id:
        parent = await get_page(data.parent_id, tenant_id, db)
        if parent:
            page_path = f"{parent.path.rstrip('/')}/{page_slug}"
    if not page_path:
        page_path = f"/{page_slug}"

    page = CmsPage(
        tenant_id=tenant_id,
        title=data.title,
        slug=page_slug,
        path=page_path,
        page_type=data.page_type,
        parent_id=data.parent_id,
        sort_order=data.sort_order,
        seo=data.seo,
        hero=data.hero,
        sections=[s.model_dump() for s in data.sections],
        created_by=user_id,
    )
    db.add(page)
    await db.flush()
    await db.refresh(page)
    return page


async def update_page(
    page_id: int,
    tenant_id: uuid_mod.UUID,
    data: PageUpdate,
    db: AsyncSession,
    user_id: uuid_mod.UUID | None = None,
) -> CmsPage | None:
    from app.services.page_version_service import _compute_change_summary, create_version_snapshot

    page = await get_page(page_id, tenant_id, db)
    if not page:
        return None

    update_data = data.model_dump(exclude_unset=True)
    if "sections" in update_data and update_data["sections"] is not None:
        update_data["sections"] = [s.model_dump() for s in data.sections]

    # Create version snapshot before applying changes
    change_summary = _compute_change_summary(page, update_data)
    await create_version_snapshot(page, user_id, db, change_summary)

    # When status changes to published, set published_at if not provided
    new_status = update_data.get("status")
    if new_status == "published" and "published_at" not in update_data:
        update_data["published_at"] = datetime.now(timezone.utc)

    # When reverting to draft, clear published_at
    if new_status == "draft":
        update_data["published_at"] = None

    for key, value in update_data.items():
        setattr(page, key, value)

    await db.flush()
    await db.refresh(page)
    return page


async def publish_page(page_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsPage | None:
    page = await get_page(page_id, tenant_id, db)
    if not page:
        return None
    page.status = "published"
    page.published_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(page)
    return page


async def unpublish_page(page_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> CmsPage | None:
    page = await get_page(page_id, tenant_id, db)
    if not page:
        return None
    page.status = "draft"
    page.published_at = None
    await db.flush()
    await db.refresh(page)
    return page


async def reorder_pages(
    tenant_id: uuid_mod.UUID,
    order: list[dict],
    db: AsyncSession,
) -> bool:
    """Update sort_order (and optionally parent_id) for a list of pages.
    order: [{"id": 1, "sort_order": 0, "parent_id": null}, ...]
    """
    for item in order:
        page = await get_page(item["id"], tenant_id, db)
        if page:
            page.sort_order = item["sort_order"]
            if "parent_id" in item:
                page.parent_id = item["parent_id"]
    await db.flush()
    return True


async def auto_organize(tenant_id: uuid_mod.UUID, db: AsyncSession) -> dict:
    """Auto-sort pages alphabetically, respecting existing parent_id hierarchy.

    Homepage (slug 'home') is always sorted first.
    Parent-child relationships are set by users via the Page Editor UI.
    """
    pages = await list_pages(tenant_id, db)
    if not pages:
        return {"organized": 0}

    # Group by parent
    children_of: dict[int | None, list[CmsPage]] = {}
    for p in pages:
        children_of.setdefault(p.parent_id, []).append(p)

    # Sort each level alphabetically, homepage first
    for group in children_of.values():
        group.sort(key=lambda p: (0, "") if p.slug == "home" else (1, p.title.lower()))
        for i, p in enumerate(group):
            p.sort_order = i

    await db.flush()
    return {"organized": len(pages)}


async def delete_page(page_id: int, tenant_id: uuid_mod.UUID, db: AsyncSession) -> bool:
    page = await get_page(page_id, tenant_id, db)
    if not page:
        return False
    await db.delete(page)
    return True
