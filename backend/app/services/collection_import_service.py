"""CSV/JSON Import Service für Collections."""
import csv
import io
import json
import uuid as uuid_mod
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.collection import CmsCollection
from app.schemas.collection import CollectionItemCreate
from app.services.collection_service import create_item


@dataclass
class ImportResult:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)


def _decode(content: bytes) -> str:
    """Decode bytes with UTF-8 (BOM-aware) fallback to latin-1."""
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="replace")


def parse_csv(content: bytes) -> tuple[list[str], list[dict]]:
    """CSV parsen -> (spalten, zeilen als dicts)."""
    text = _decode(content)
    reader = csv.DictReader(io.StringIO(text))
    columns = reader.fieldnames or []
    rows = list(reader)
    return list(columns), rows


def parse_json(content: bytes) -> tuple[list[str], list[dict]]:
    """JSON parsen (Array von Objekten) -> (schlüssel, zeilen)."""
    text = _decode(content)
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("JSON muss ein Array von Objekten sein")
    if not data:
        return [], []
    columns: list[str] = []
    for row in data:
        if not isinstance(row, dict):
            raise ValueError("Jedes Element im Array muss ein Objekt sein")
        for key in row:
            if key not in columns:
                columns.append(key)
    return columns, data


def preview_import(content: bytes, filename: str) -> dict:
    """Datei parsen, erste 5 Zeilen + Spalten zurückgeben."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "csv":
        columns, rows = parse_csv(content)
    elif ext == "json":
        columns, rows = parse_json(content)
    else:
        raise ValueError(f"Nicht unterstütztes Dateiformat: .{ext} (nur .csv und .json)")
    return {
        "columns": columns,
        "rows_preview": rows[:5],
        "total_rows": len(rows),
    }


async def _find_by_slug(
    slug: str, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> CmsCollection | None:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.slug == slug,
            CmsCollection.deleted_at.is_(None),
        ).limit(1)
    )
    return result.scalar_one_or_none()


async def _find_by_title(
    title: str, collection_key: str, tenant_id: uuid_mod.UUID, db: AsyncSession,
) -> CmsCollection | None:
    result = await db.execute(
        select(CmsCollection).where(
            CmsCollection.tenant_id == tenant_id,
            CmsCollection.collection_key == collection_key,
            CmsCollection.title == title,
            CmsCollection.deleted_at.is_(None),
        ).limit(1)
    )
    return result.scalar_one_or_none()


async def execute_import(
    collection_key: str,
    tenant_id: uuid_mod.UUID,
    db: AsyncSession,
    rows: list[dict],
    field_mapping: dict[str, str],
    title_column: str,
    status: str = "draft",
    conflict: str = "skip",
    slug_field: str | None = None,
) -> ImportResult:
    """Zeilen importieren mit Mapping. Duplikat-Erkennung via slug oder title."""
    result = ImportResult()

    for i, row in enumerate(rows):
        try:
            title_val = str(row.get(title_column, "")).strip()
            if not title_val:
                result.errors.append(f"Zeile {i + 1}: Kein Titel (Spalte '{title_column}')")
                result.skipped += 1
                continue

            # Build data dict from mapping
            data: dict = {}
            for src_col, target_field in field_mapping.items():
                if src_col == title_column and target_field == "title":
                    continue
                val = row.get(src_col)
                if val is not None:
                    data[target_field] = val

            # Check for duplicates
            existing = None
            if slug_field:
                from app.utils.slugify import slugify
                slug_val = slugify(title_val)
                existing = await _find_by_slug(slug_val, collection_key, tenant_id, db)
            else:
                existing = await _find_by_title(title_val, collection_key, tenant_id, db)

            if existing:
                if conflict == "skip":
                    result.skipped += 1
                    continue
                # overwrite
                for key, value in data.items():
                    existing.data[key] = value
                existing.data = dict(existing.data)  # trigger SQLAlchemy change detection
                existing.status = status
                result.updated += 1
            else:
                item_status = "draft" if status == "draft" else "published"
                item_data = CollectionItemCreate(
                    title=title_val,
                    data=data,
                    status=item_status,
                )
                await create_item(collection_key, tenant_id, item_data, db)
                result.created += 1

        except Exception as e:
            result.errors.append(f"Zeile {i + 1}: {str(e)}")

    await db.flush()
    return result
