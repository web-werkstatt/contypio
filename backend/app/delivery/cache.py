"""Simple in-memory cache with TTL for delivery responses."""
import time
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user

_cache: dict[str, tuple[float, object]] = {}
DEFAULT_TTL = 60


def get_cached(key: str) -> object | None:
    if key in _cache:
        ts, value = _cache[key]
        if time.time() - ts < DEFAULT_TTL:
            return value
        del _cache[key]
    return None


def set_cached(key: str, value: object):
    _cache[key] = (time.time(), value)


def clear_cache():
    _cache.clear()


router = APIRouter(prefix="/api/cache", tags=["cache"])


@router.post("/clear", status_code=204)
async def clear(user=Depends(get_current_user)):
    clear_cache()
