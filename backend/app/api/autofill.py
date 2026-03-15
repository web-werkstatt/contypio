"""API routes for auto-filling block data from external sources."""

from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.services.travel_api import fetch_trips, fetch_filter_options

router = APIRouter(prefix="/api/autofill", tags=["autofill"])


@router.get("/trips")
async def get_trips(
    limit: int = Query(6, ge=1, le=50),
    continent: str | None = None,
    country: str | None = None,
    theme: str | None = None,
    travel_type: str | None = None,
    featured: bool = False,
    user: CmsUser = Depends(get_current_user),
):
    return await fetch_trips(
        limit=limit,
        continent=continent,
        country=country,
        theme=theme,
        travel_type=travel_type,
        featured_only=featured,
    )


@router.get("/filters")
async def get_filters(user: CmsUser = Depends(get_current_user)):
    return await fetch_filter_options()
