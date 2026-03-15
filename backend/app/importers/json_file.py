"""JSON File Importer - imports from CMS export format or generic JSON."""

from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.importers.base import (
    BaseImporter, CollectionInfo, FieldInfo, GlobalInfo,
    ImportManifest, ImportMapping, ImportResult, PageInfo,
    ProgressCallback,
)
from app.importers.registry import register
from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.global_config import CmsGlobal
from app.models.page import CmsPage


@register
class JsonFileImporter(BaseImporter):
    name = "JSON Datei"
    slug = "json"
    description = "Import aus JSON-Datei (CMS Export-Format)"
    config_fields = [
        FieldInfo(name="data", label="JSON Daten", type="json", required=True),
    ]

    async def test_connection(self, config: dict) -> tuple[bool, str]:
        data = config.get("data")
        if not data:
            return False, "Keine JSON-Daten angegeben"
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError as e:
                return False, f"Ungueltiges JSON: {e}"
        if not isinstance(data, dict):
            return False, "JSON muss ein Objekt sein"
        return True, "JSON gueltig"

    async def discover(self, config: dict) -> ImportManifest:
        data = self._parse_data(config)
        manifest = ImportManifest()

        # Globals
        for key, val in data.get("globals", {}).items():
            if isinstance(val, dict):
                field_count = len(val.get("data", val))
                label = val.get("label", key.replace("-", " ").title())
                manifest.globals.append(GlobalInfo(key, label, field_count))

        # Collections
        for key, val in data.get("collections", {}).items():
            if isinstance(val, dict):
                items = val.get("items", [])
                manifest.collections.append(
                    CollectionInfo(key, val.get("label", key), len(items)))

        # Pages
        pages = data.get("pages", [])
        if pages:
            manifest.pages = PageInfo(count=len(pages), has_tree=False)

        return manifest

    async def import_data(
        self,
        config: dict,
        mapping: ImportMapping,
        tenant_id: UUID,
        db: AsyncSession,
        on_progress: ProgressCallback | None = None,
    ) -> ImportResult:
        data = self._parse_data(config)
        result = ImportResult()

        def progress(msg: str, current: int = 0, total: int = 0):
            if on_progress:
                on_progress(msg, current, total)

        # 1. Globals
        globals_data = data.get("globals", {})
        selected_globals = [k for k in mapping.globals if k in globals_data]
        if selected_globals:
            progress("Globals importieren...", 0, len(selected_globals))
            for i, key in enumerate(selected_globals):
                val = globals_data[key]
                g_data = val.get("data", val) if isinstance(val, dict) else val
                label = val.get("label", key.replace("-", " ").title()) if isinstance(val, dict) else key
                await self._upsert_global(key, label, g_data, tenant_id, db,
                                          result, mapping.conflict)
                progress("Globals importieren...", i + 1, len(selected_globals))

        # 2. Pages
        pages = data.get("pages", [])
        if mapping.import_pages and pages:
            progress("Pages importieren...", 0, len(pages))
            for i, page_data in enumerate(pages):
                try:
                    await self._import_page(page_data, tenant_id, db,
                                            result, mapping.conflict)
                except Exception as e:
                    result.errors.append(f"Page: {e}")
                progress("Pages importieren...", i + 1, len(pages))

        # 3. Collections
        collections_data = data.get("collections", {})
        for coll_key in mapping.collections:
            coll = collections_data.get(coll_key)
            if not coll:
                continue
            items = coll.get("items", [])
            schema = coll.get("schema")
            if schema:
                await self._ensure_schema_from_json(coll_key, schema, tenant_id, db)
                result.collections_created += 1

            progress(f"{coll_key} importieren...", 0, len(items))
            for i, item in enumerate(items):
                try:
                    await self._import_item(coll_key, item, tenant_id, db,
                                            result, mapping.conflict)
                except Exception as e:
                    result.errors.append(f"{coll_key}: {e}")
                progress(f"{coll_key} importieren...", i + 1, len(items))

        await db.flush()
        progress("Import abgeschlossen", 1, 1)
        return result

    def _parse_data(self, config: dict) -> dict:
        data = config.get("data", {})
        if isinstance(data, str):
            data = json.loads(data)
        return data

    async def _upsert_global(
        self, slug: str, label: str, data: dict,
        tenant_id: UUID, db: AsyncSession,
        result: ImportResult, conflict: str,
    ):
        existing = await db.execute(
            select(CmsGlobal).where(
                CmsGlobal.slug == slug, CmsGlobal.tenant_id == tenant_id)
        )
        obj = existing.scalar_one_or_none()
        if obj:
            if conflict == "skip":
                return
            obj.data = data
            obj.label = label
            result.globals_updated += 1
        else:
            db.add(CmsGlobal(slug=slug, label=label, data=data, tenant_id=tenant_id))
            result.globals_created += 1

    async def _import_page(
        self, page_data: dict, tenant_id: UUID, db: AsyncSession,
        result: ImportResult, conflict: str,
    ):
        path = page_data.get("path", "")
        slug = page_data.get("slug", path.strip("/").split("/")[-1] or "page")

        existing = await db.execute(
            select(CmsPage).where(
                CmsPage.path == path, CmsPage.tenant_id == tenant_id)
        )
        obj = existing.scalar_one_or_none()
        if obj:
            if conflict == "skip":
                return
            obj.title = page_data.get("title", slug)
            obj.page_type = page_data.get("page_type", obj.page_type)
            obj.collection_key = page_data.get("collection_key") or obj.collection_key
            obj.seo = page_data.get("seo", obj.seo)
            obj.hero = page_data.get("hero", obj.hero)
            obj.sections = page_data.get("sections", obj.sections)
            result.pages_updated += 1
            return

        from datetime import datetime, timezone
        db.add(CmsPage(
            title=page_data.get("title", slug),
            slug=slug,
            path=path,
            page_type=page_data.get("page_type", "content"),
            collection_key=page_data.get("collection_key"),
            status="published",
            seo=page_data.get("seo", {}),
            hero=page_data.get("hero", {}),
            sections=page_data.get("sections", []),
            tenant_id=tenant_id,
            published_at=datetime.now(timezone.utc),
        ))
        result.pages_created += 1

    async def _ensure_schema_from_json(
        self, key: str, schema: dict, tenant_id: UUID, db: AsyncSession,
    ):
        existing = await db.execute(
            select(CmsCollectionSchema).where(
                CmsCollectionSchema.collection_key == key,
                CmsCollectionSchema.tenant_id == tenant_id)
        )
        if existing.scalar_one_or_none():
            return
        db.add(CmsCollectionSchema(
            collection_key=key,
            label=schema.get("label", key),
            label_singular=schema.get("label_singular", key),
            icon=schema.get("icon", "Database"),
            fields=schema.get("fields", []),
            tenant_id=tenant_id,
        ))
        await db.flush()

    async def _import_item(
        self, coll_key: str, item: dict, tenant_id: UUID,
        db: AsyncSession, result: ImportResult, conflict: str,
    ):
        title = item.get("title", "")
        slug = item.get("slug")

        if slug:
            existing = await db.execute(
                select(CmsCollection).where(
                    CmsCollection.collection_key == coll_key,
                    CmsCollection.slug == slug,
                    CmsCollection.tenant_id == tenant_id)
            )
            obj = existing.scalar_one_or_none()
            if obj:
                if conflict == "skip":
                    return
                obj.title = title
                obj.data = item.get("data", {})
                obj.status = item.get("status", "published")
                obj.sort_order = item.get("sort_order", 0)
                result.items_updated += 1
                return

        db.add(CmsCollection(
            collection_key=coll_key,
            title=title,
            slug=slug,
            data=item.get("data", {}),
            status=item.get("status", "published"),
            sort_order=item.get("sort_order", 0),
            tenant_id=tenant_id,
        ))
        result.items_created += 1
