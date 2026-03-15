"""Fetch travel data from the IR-Tours FastAPI (port 8101) for auto-fill."""

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("cms")

TRAVEL_API_URL = os.getenv("TRAVEL_API_URL", "http://host.docker.internal:8101")


async def fetch_trips(
    limit: int = 6,
    continent: str | None = None,
    country: str | None = None,
    theme: str | None = None,
    travel_type: str | None = None,
    featured_only: bool = False,
) -> list[dict[str, Any]]:
    """Fetch published trips from the Travel API."""
    base = TRAVEL_API_URL
    params: dict[str, Any] = {
        "limit": limit,
        "publish_status": "published",
    }
    if continent:
        params["kontinent"] = continent
    if country:
        params["land"] = country
    if theme:
        params["thema"] = theme
    if travel_type:
        params["kategorie"] = travel_type
    if featured_only:
        params["featured"] = "true"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{base}/api/travels", params=params)
            r.raise_for_status()
            data = r.json()
            trips = data.get("data", data) if isinstance(data, dict) else data
            return [
                {
                    "tripId": str(t["id"]),
                    "label": t.get("reisename", ""),
                    "slug": t.get("url_slug", ""),
                    "continent": t.get("kontinent", ""),
                    "country": t.get("land", ""),
                    "price": t.get("reise_preis"),
                    "duration": t.get("dauer"),
                    "image": t.get("katalogbild", ""),
                    "shortDescription": t.get("kurzbeschreibung", ""),
                }
                for t in (trips or [])[:limit]
            ]
    except Exception as e:
        logger.warning("Failed to fetch trips from %s: %s", base, e)
        return []


async def fetch_filter_options() -> dict[str, list[str]]:
    """Fetch available filter options (continents, countries, themes)."""
    base = TRAVEL_API_URL
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{base}/api/travels/filters")
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning("Failed to fetch filter options: %s", e)
        return {"continents": [], "countries": [], "themes": []}
