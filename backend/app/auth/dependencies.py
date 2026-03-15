from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import CmsUser
from app.auth.security import decode_access_token
from app.core.database import get_db
from app.core.errors import get_error

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> CmsUser:
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error("auth.invalid_token"))
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error("auth.invalid_token"))

    result = await db.execute(select(CmsUser).where(CmsUser.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error("auth.user_not_found"))
    return user


def require_role(*roles: str):
    async def role_checker(user: CmsUser = Depends(get_current_user)) -> CmsUser:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=get_error("auth.insufficient_permissions"))
        return user
    return role_checker
