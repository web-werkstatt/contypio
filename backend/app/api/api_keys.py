"""Admin CRUD endpoints for API key management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.api_key import CmsApiKey, generate_api_key
from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyRead

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])


@router.get("", response_model=list[ApiKeyRead])
async def list_api_keys(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können API-Schlüssel verwalten")
    result = await db.execute(
        select(CmsApiKey)
        .where(CmsApiKey.tenant_id == user.tenant_id)
        .order_by(CmsApiKey.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können API-Schlüssel erstellen")

    raw_key, key_hash, key_prefix = generate_api_key()

    api_key = CmsApiKey(
        tenant_id=user.tenant_id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scopes=data.scopes,
        expires_at=data.expires_at,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    response = ApiKeyCreatedResponse.model_validate(api_key)
    response.raw_key = raw_key
    return response


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    result = await db.execute(
        select(CmsApiKey).where(CmsApiKey.id == key_id, CmsApiKey.tenant_id == user.tenant_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API-Schlüssel nicht gefunden")
    await db.delete(api_key)
    await db.commit()


@router.patch("/{key_id}/toggle")
async def toggle_api_key(
    key_id: int,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    result = await db.execute(
        select(CmsApiKey).where(CmsApiKey.id == key_id, CmsApiKey.tenant_id == user.tenant_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API-Schlüssel nicht gefunden")
    api_key.active = not api_key.active
    await db.commit()
    return {"id": api_key.id, "active": api_key.active}
