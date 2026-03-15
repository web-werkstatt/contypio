import uuid as uuid_mod

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import CmsPage
from app.models.page_version import CmsPageVersion

MAX_VERSIONS_PER_PAGE = 50


def _compute_change_summary(old: CmsPage | None, new_data: dict) -> str:
    """Generate a human-readable change summary."""
    if old is None:
        return "Seite erstellt"

    changes: list[str] = []

    if "title" in new_data and new_data["title"] != old.title:
        changes.append("Titel")
    if "slug" in new_data and new_data["slug"] != old.slug:
        changes.append("Slug")
    if "status" in new_data and new_data["status"] != old.status:
        changes.append(f"Status: {new_data['status']}")
    if "seo" in new_data:
        changes.append("SEO")
    if "sections" in new_data:
        old_count = len(old.sections) if old.sections else 0
        new_count = len(new_data["sections"]) if new_data["sections"] else 0
        if old_count != new_count:
            changes.append(f"Sektionen: {old_count} \u2192 {new_count}")
        else:
            changes.append("Inhalte")
    if "hero" in new_data:
        changes.append("Hero")

    return ", ".join(changes) if changes else "Aktualisiert"


async def create_version_snapshot(
    page: CmsPage,
    user_id: uuid_mod.UUID | None,
    db: AsyncSession,
    change_summary: str | None = None,
) -> CmsPageVersion:
    """Create a version snapshot of the current page state (before changes)."""
    # Get next version number
    result = await db.execute(
        select(func.coalesce(func.max(CmsPageVersion.version_number), 0))
        .where(CmsPageVersion.page_id == page.id)
    )
    next_version = result.scalar() + 1

    version = CmsPageVersion(
        tenant_id=page.tenant_id,
        page_id=page.id,
        version_number=next_version,
        title=page.title,
        slug=page.slug,
        status=page.status,
        seo=page.seo or {},
        hero=page.hero or {},
        sections=page.sections or [],
        change_summary=change_summary,
        created_by=user_id,
    )
    db.add(version)

    # Prune old versions beyond MAX_VERSIONS_PER_PAGE
    count_result = await db.execute(
        select(func.count()).where(CmsPageVersion.page_id == page.id)
    )
    total = count_result.scalar() or 0

    if total >= MAX_VERSIONS_PER_PAGE:
        # Delete oldest versions
        oldest = await db.execute(
            select(CmsPageVersion.id)
            .where(CmsPageVersion.page_id == page.id)
            .order_by(CmsPageVersion.version_number.asc())
            .limit(total - MAX_VERSIONS_PER_PAGE + 1)
        )
        old_ids = [row[0] for row in oldest.all()]
        if old_ids:
            await db.execute(
                delete(CmsPageVersion).where(CmsPageVersion.id.in_(old_ids))
            )

    await db.flush()
    return version


async def list_versions(
    page_id: int,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
    limit: int = 50,
) -> list[CmsPageVersion]:
    result = await db.execute(
        select(CmsPageVersion)
        .where(CmsPageVersion.page_id == page_id, CmsPageVersion.tenant_id == tenant_id)
        .order_by(CmsPageVersion.version_number.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_version(
    version_id: int,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
) -> CmsPageVersion | None:
    result = await db.execute(
        select(CmsPageVersion)
        .where(CmsPageVersion.id == version_id, CmsPageVersion.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()
