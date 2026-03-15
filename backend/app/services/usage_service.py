"""Track and check tenant usage against plan limits."""
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import CmsUser
from app.models.media import CmsMedia
from app.models.page import CmsPage
from app.models.tenant import CmsTenant


async def get_usage(tenant_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return current usage counts for a tenant."""
    page_count = await db.scalar(
        select(func.count()).where(CmsPage.tenant_id == tenant_id)
    ) or 0

    media_result = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(CmsMedia.file_size), 0).label("total_bytes"),
        ).where(CmsMedia.tenant_id == tenant_id)
    )
    media_row = media_result.one()
    media_count = media_row.count
    media_mb = round(media_row.total_bytes / (1024 * 1024), 1)

    user_count = await db.scalar(
        select(func.count()).where(
            CmsUser.tenant_id == tenant_id, CmsUser.active.is_(True)
        )
    ) or 0

    return {
        "pages": page_count,
        "media_count": media_count,
        "media_mb": media_mb,
        "users": user_count,
    }


async def get_usage_with_limits(tenant_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return usage + limits + percentages for dashboard display."""
    tenant = await db.get(CmsTenant, tenant_id)
    if not tenant:
        return {}

    usage = await get_usage(tenant_id, db)
    return {
        "plan": tenant.plan,
        "pages": {
            "used": usage["pages"],
            "max": tenant.max_pages,
            "percent": round(usage["pages"] / tenant.max_pages * 100) if tenant.max_pages > 0 else 0,
        },
        "media_mb": {
            "used": usage["media_mb"],
            "max": tenant.max_media_mb,
            "percent": round(usage["media_mb"] / tenant.max_media_mb * 100) if tenant.max_media_mb > 0 else 0,
        },
        "users": {
            "used": usage["users"],
            "max": tenant.max_users,
            "percent": round(usage["users"] / tenant.max_users * 100) if tenant.max_users > 0 else 0,
        },
    }


async def check_limit(
    tenant_id: uuid.UUID, resource: str, db: AsyncSession
) -> tuple[bool, str]:
    """Check if tenant can create another resource. Returns (allowed, message)."""
    tenant = await db.get(CmsTenant, tenant_id)
    if not tenant:
        return False, "Tenant not found"

    usage = await get_usage(tenant_id, db)

    if resource == "page" and usage["pages"] >= tenant.max_pages:
        return False, f"Seitenlimit erreicht ({tenant.max_pages} Seiten im {tenant.plan}-Plan)"
    if resource == "media" and usage["media_mb"] >= tenant.max_media_mb:
        return False, f"Speicherlimit erreicht ({tenant.max_media_mb} MB im {tenant.plan}-Plan)"
    if resource == "user" and usage["users"] >= tenant.max_users:
        return False, f"Benutzerlimit erreicht ({tenant.max_users} Benutzer im {tenant.plan}-Plan)"

    return True, ""
