from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.auth.models import CmsUser
from app.auth.schemas import LoginRequest, PasswordChange, ProfileUpdate, TokenResponse, UserCreate, UserRead
from app.auth.security import create_access_token, hash_password, verify_password
from app.core.database import get_db
from app.core.i18n import translated_error
from app.services.usage_service import check_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CmsUser).where(CmsUser.email == data.email, CmsUser.active.is_(True)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise translated_error(request, status.HTTP_401_UNAUTHORIZED, "auth.invalid_credentials")

    token = create_access_token({"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
async def me(user: CmsUser = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
async def update_profile(
    data: ProfileUpdate,
    request: Request,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.email is not None:
        existing = await db.execute(
            select(CmsUser).where(
                CmsUser.tenant_id == user.tenant_id,
                CmsUser.email == data.email,
                CmsUser.id != user.id,
            )
        )
        if existing.scalar_one_or_none():
            raise translated_error(request, 409, "auth.email_taken")
        user.email = data.email
    if data.display_name is not None:
        user.display_name = data.display_name
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    request: Request,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, user.hashed_password):
        raise translated_error(request, 400, "auth.wrong_password")
    user.hashed_password = hash_password(data.new_password)
    await db.flush()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: CmsUser = Depends(require_role("admin")),
):
    allowed, msg = await check_limit(admin.tenant_id, "user", db)
    if not allowed:
        raise HTTPException(status_code=403, detail=msg)
    existing = await db.execute(
        select(CmsUser).where(CmsUser.tenant_id == admin.tenant_id, CmsUser.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise translated_error(request, status.HTTP_409_CONFLICT, "auth.email_taken")

    user = CmsUser(
        tenant_id=admin.tenant_id,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        display_name=data.display_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
