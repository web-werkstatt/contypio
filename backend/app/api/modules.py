"""Module management API - List, activate/deactivate, bulk-activate."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.tenant import CmsTenant
from app.services.module_registry import (
    get_modules_response,
    validate_module_activation,
)

router = APIRouter(prefix="/api/modules", tags=["modules"])


class ModuleUpdateRequest(BaseModel):
    active_modules: list[str]


class BulkActivateRequest(BaseModel):
    modules: list[str]
    edition: str | None = None


@router.get("")
async def list_modules(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Alle Module mit available/active Status."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant nicht gefunden")
    return get_modules_response(tenant)


@router.patch("")
async def update_modules(
    data: ModuleUpdateRequest,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Active-Module-Liste updaten (Admin only)."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant nicht gefunden")

    ok, error = validate_module_activation(tenant.edition, data.active_modules)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    settings = dict(tenant.settings) if tenant.settings else {}
    settings["active_modules"] = data.active_modules
    tenant.settings = settings
    await db.flush()
    await db.refresh(tenant)
    return get_modules_response(tenant)


@router.post("/bulk-activate")
async def bulk_activate(
    data: BulkActivateRequest,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """AI-Setup-Endpoint: Module programmatisch aktivieren."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant nicht gefunden")

    if data.edition:
        from app.services.edition_gate import VALID_EDITIONS
        if data.edition not in VALID_EDITIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Ungueltige Edition: {data.edition}. Erlaubt: {', '.join(sorted(VALID_EDITIONS))}",
            )
        tenant.edition = data.edition

    edition = tenant.edition
    ok, error = validate_module_activation(edition, data.modules)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    settings = dict(tenant.settings) if tenant.settings else {}
    settings["active_modules"] = data.modules
    tenant.settings = settings
    await db.flush()
    await db.refresh(tenant)
    return {"status": "ok", "active_modules": data.modules, "edition": tenant.edition}
