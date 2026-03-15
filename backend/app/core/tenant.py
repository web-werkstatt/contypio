import uuid

from fastapi import Depends

from app.auth.dependencies import get_current_user


async def get_tenant_id(user=Depends(get_current_user)) -> uuid.UUID:
    return user.tenant_id
