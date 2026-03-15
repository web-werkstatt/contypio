"""Resolve imageId references in sections to full media objects.
Also resolve dynamic data blocks (tripListing, featuredTrips with source=auto).
"""
import logging
import uuid as uuid_mod

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.media import CmsMedia

logger = logging.getLogger("cms")


async def collect_image_ids(sections: list[dict]) -> set[int]:
    """Walk sections -> columns -> blocks and collect all imageId references."""
    ids: set[int] = set()
    for section in sections:
        for column in section.get("columns", []):
            for block in column.get("blocks", []):
                data = block.get("data", {})
                if img_id := data.get("imageId"):
                    ids.add(img_id)
                for item in data.get("images", []):
                    if img_id := item.get("id"):
                        ids.add(img_id)
                for item in data.get("items", []):
                    if img_id := item.get("imageId"):
                        ids.add(img_id)
    return ids


async def build_media_cache(
    image_ids: set[int], tenant_id: uuid_mod.UUID, db: AsyncSession
) -> dict[int, dict]:
    """Batch-load media records and return {id: media_dict}."""
    if not image_ids:
        return {}
    result = await db.execute(
        select(CmsMedia).where(CmsMedia.id.in_(image_ids), CmsMedia.tenant_id == tenant_id)
    )
    base_url = settings.API_ASSET_URL.rstrip("/")
    cache = {}
    for media in result.scalars().all():
        sizes = {}
        for key, size_info in (media.sizes or {}).items():
            sizes[key] = {**size_info, "url": f"{base_url}{size_info['url']}"}
        cache[media.id] = {
            "id": media.id,
            "url": f"{base_url}{media.url}",
            "alt": media.alt or "",
            "width": media.width,
            "height": media.height,
            "sizes": sizes,
        }
    return cache


async def _resolve_travel_block(block_type: str, data: dict) -> dict:
    """Resolve travel-specific blocks (featuredTrips, tripListing)."""
    from app.services.travel_api import fetch_trips

    filters = data.get("filters", {})
    limit = data.get("maxItems", 12)
    featured_only = block_type == "featuredTrips"
    try:
        trips = await fetch_trips(
            limit=limit,
            continent=filters.get("continent"),
            country=filters.get("country"),
            theme=filters.get("theme"),
            travel_type=filters.get("travelType"),
            featured_only=featured_only,
        )
        data["resolvedItems"] = trips
        # Backwards compat
        data["resolvedTrips"] = trips
        data["resolvedAt"] = True
    except Exception as e:
        logger.warning("Failed to resolve travel block %s: %s", block_type, e)
        data["resolvedItems"] = []
        data["resolvedTrips"] = []
    return data


async def _resolve_collection_block(block_type: str, data: dict, tenant_id: "uuid_mod.UUID", db: AsyncSession) -> dict:
    """Resolve generic collection-based blocks (featuredItems, collectionListing, collectionTiles)."""
    from app.services.collection_service import list_items

    collection_key = data.get("collectionKey", "")
    if not collection_key:
        data["resolvedItems"] = []
        return data

    limit = data.get("maxItems", 12)
    try:
        items, _total = await list_items(collection_key, tenant_id, db, limit=limit)
        data["resolvedItems"] = [
            {
                "id": item.id,
                "title": item.title,
                "slug": item.slug,
                "data": item.data,
                "image_id": item.image_id,
            }
            for item in items
        ]
        data["resolvedAt"] = True
    except Exception as e:
        logger.warning("Failed to resolve collection block %s (key=%s): %s", block_type, collection_key, e)
        data["resolvedItems"] = []
    return data


# Travel block types (legacy + current)
_TRAVEL_BLOCK_TYPES = {"tripListing", "featuredTrips"}
# Generic collection block types
_COLLECTION_BLOCK_TYPES = {"featuredItems", "collectionListing", "collectionTiles"}


async def resolve_dynamic_blocks(
    sections: list[dict],
    tenant_id: "uuid_mod.UUID | None" = None,
    db: "AsyncSession | None" = None,
) -> list[dict]:
    """Resolve data blocks with source=auto by fetching live data.

    Supports both legacy travel-specific blocks and generic collection-based blocks.
    """
    resolved = []
    for section in sections:
        new_columns = []
        for column in section.get("columns", []):
            new_blocks = []
            for block in column.get("blocks", []):
                block_type = block.get("blockType", "")
                data = {**block.get("data", {})}

                if block_type in _TRAVEL_BLOCK_TYPES and data.get("source") == "auto":
                    data = await _resolve_travel_block(block_type, data)
                elif block_type in _COLLECTION_BLOCK_TYPES and tenant_id and db:
                    data = await _resolve_collection_block(block_type, data, tenant_id, db)

                new_blocks.append({**block, "data": data})
            new_columns.append({**column, "blocks": new_blocks})
        resolved.append({**section, "columns": new_columns})
    return resolved


def resolve_grid_layouts(sections: list[dict], include_css: bool = False) -> list[dict]:
    """Enrich sections with resolved grid layout config and optional CSS.

    For each section, adds a `layout_resolved` dict with:
    - key: layout preset key or "custom"
    - grid_config: structured track/gap/areas data
    - css: (optional) scoped CSS string, only if include_css=True
    """
    from app.core.grid import resolve_grid

    enriched = []
    for section in sections:
        section = {**section}
        layout_key = section.get("layout", "full")
        grid_config = section.get("grid_config")

        try:
            grid = resolve_grid(layout_key, grid_config)
            layout_data: dict = {
                "key": grid.key,
                "grid_config": grid.to_config(),
            }
            if include_css:
                layout_data["css"] = grid.to_css(section.get("id", "unknown"))
        except (ValueError, KeyError):
            # Fallback: return raw layout key without resolved data
            layout_data = {"key": layout_key, "grid_config": None}
            if include_css:
                layout_data["css"] = None

        section["layout_resolved"] = layout_data
        enriched.append(section)
    return enriched


def resolve_sections(sections: list[dict], media_cache: dict[int, dict]) -> list[dict]:
    """Replace imageId references with resolved media objects."""
    resolved = []
    for section in sections:
        new_section = {**section}
        new_columns = []
        for column in section.get("columns", []):
            new_blocks = []
            for block in column.get("blocks", []):
                data = {**block.get("data", {})}
                # Resolve single imageId
                if "imageId" in data and data["imageId"] in media_cache:
                    data["image"] = media_cache[data["imageId"]]
                # Resolve images array (gallery)
                if "images" in data:
                    data["images"] = [
                        {**img, "image": media_cache.get(img.get("id", 0))}
                        for img in data["images"]
                    ]
                # Resolve items with imageId (cards)
                if "items" in data:
                    data["items"] = [
                        {**item, "image": media_cache.get(item.get("imageId", 0))}
                        if "imageId" in item else item
                        for item in data["items"]
                    ]
                new_blocks.append({**block, "data": data})
            new_columns.append({**column, "blocks": new_blocks})
        new_section["columns"] = new_columns
        resolved.append(new_section)
    return resolved
