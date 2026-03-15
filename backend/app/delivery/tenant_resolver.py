"""Resolve tenant for public delivery endpoints.

Resolution order:
1. `X-Tenant` header (slug or domain)
2. `Host` header matched against CmsTenant.domain
3. Fallback to DEFAULT_TENANT_SLUG from config
"""

import logging
from uuid import UUID

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.delivery.cache import get_cached, set_cached
from app.models.tenant import CmsTenant

logger = logging.getLogger("cms.delivery")

# Cache keys
_TENANT_CACHE_PREFIX = "tenant:"


async def _find_tenant_by_slug(slug: str, db: AsyncSession) -> CmsTenant | None:
    cache_key = f"{_TENANT_CACHE_PREFIX}slug:{slug}"
    cached = get_cached(cache_key)
    if isinstance(cached, CmsTenant):
        return cached

    result = await db.execute(
        select(CmsTenant).where(CmsTenant.slug == slug, CmsTenant.active.is_(True))
    )
    tenant = result.scalar_one_or_none()
    if tenant:
        set_cached(cache_key, tenant)
    return tenant


async def _find_tenant_by_domain(domain: str, db: AsyncSession) -> CmsTenant | None:
    cache_key = f"{_TENANT_CACHE_PREFIX}domain:{domain}"
    cached = get_cached(cache_key)
    if isinstance(cached, CmsTenant):
        return cached

    result = await db.execute(
        select(CmsTenant).where(CmsTenant.domain == domain, CmsTenant.active.is_(True))
    )
    tenant = result.scalar_one_or_none()
    if tenant:
        set_cached(cache_key, tenant)
    return tenant


def _extract_host(request: Request) -> str:
    """Extract clean hostname from Host header (strip port)."""
    host = request.headers.get("host", "")
    return host.split(":")[0].lower().strip()


async def get_delivery_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CmsTenant:
    """Resolve full tenant object for delivery endpoints.

    Priority:
    1. X-Tenant header (slug or domain)
    2. Host header matched against CmsTenant.domain
    3. DEFAULT_TENANT_SLUG fallback
    """
    tenant: CmsTenant | None = None

    # 1. Explicit X-Tenant header
    x_tenant = request.headers.get("x-tenant", "").strip()
    if x_tenant:
        tenant = await _find_tenant_by_slug(x_tenant, db)
        if not tenant:
            tenant = await _find_tenant_by_domain(x_tenant, db)
        if tenant:
            return tenant

    # 2. Host header -> match against CmsTenant.domain
    host = _extract_host(request)
    if host and host not in ("localhost", "127.0.0.1", ""):
        tenant = await _find_tenant_by_domain(host, db)
        if tenant:
            return tenant

    # 3. Fallback to default tenant
    tenant = await _find_tenant_by_slug(settings.DEFAULT_TENANT_SLUG, db)
    if not tenant:
        raise HTTPException(status_code=500, detail="Default tenant not found")
    return tenant


async def get_delivery_tenant_id(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UUID:
    """Resolve tenant_id for delivery endpoints. Backwards-compatible wrapper."""
    tenant = await get_delivery_tenant(request, db)
    return tenant.id
