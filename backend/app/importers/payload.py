"""Payload CMS Importer - imports globals, pages, collections from Payload REST API."""

from __future__ import annotations

from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.importers.base import (
    BaseImporter, CollectionInfo, FieldInfo, GlobalInfo,
    ImportManifest, ImportMapping, ImportResult, MediaInfo, PageInfo,
    ProgressCallback,
)
from app.importers.registry import register
from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.global_config import CmsGlobal
from app.models.page import CmsPage


def _clean_urls(data):
    """Replace Payload media URLs with relative paths."""
    if isinstance(data, str):
        if "localhost:8057" in data or "192.168.100.93:8057" in data:
            parts = data.split("/")
            return f"/images/payload/{parts[-1]}"
        return data
    elif isinstance(data, dict):
        return {k: _clean_urls(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_clean_urls(item) for item in data]
    return data


@register
class PayloadImporter(BaseImporter):
    name = "Payload CMS"
    slug = "payload"
    description = "Import aus Payload CMS (REST API)"
    config_fields = [
        FieldInfo(name="url", label="Payload URL", type="url",
                  required=True, placeholder="http://localhost:8057"),
    ]

    async def test_connection(self, config: dict) -> tuple[bool, str]:
        url = config.get("url", "").rstrip("/")
        if not url:
            return False, "URL ist leer"
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(f"{url}/api/globals/site-settings")
                if r.status_code == 200:
                    return True, "Verbindung OK"
                return False, f"HTTP {r.status_code}"
        except httpx.ConnectError:
            return False, f"Verbindung zu {url} fehlgeschlagen"
        except Exception as e:
            return False, str(e)

    async def discover(self, config: dict) -> ImportManifest:
        url = config["url"].rstrip("/")
        manifest = ImportManifest()

        async with httpx.AsyncClient(timeout=10) as client:
            # Discover globals
            global_slugs = [
                ("site-settings", "Site Settings"),
                ("agb-page-settings", "AGB"),
                ("datenschutz-page-settings", "Datenschutz"),
                ("impressum-page-settings", "Impressum"),
                ("kontakt-page-settings", "Kontakt"),
                ("service-page-settings", "Service"),
                ("reisethemen-uebersicht-settings", "Reisethemen"),
                ("reiseziele-uebersicht-settings", "Reiseziele"),
            ]
            for slug, label in global_slugs:
                try:
                    r = await client.get(f"{url}/api/globals/{slug}")
                    if r.status_code == 200:
                        data = r.json()
                        field_count = len([k for k in data if k not in
                                          ("id", "globalType", "createdAt", "updatedAt")])
                        manifest.globals.append(GlobalInfo(slug, label, field_count))
                except Exception:
                    pass

            # Discover collections
            for coll_slug, label in [
                ("portal_pages", "Portal Pages"),
                ("reise-themen", "Reise-Themen"),
                ("spezial-reisen", "Spezial-Reisen"),
                ("team-members", "Team Members"),
            ]:
                try:
                    r = await client.get(f"{url}/api/{coll_slug}?limit=0")
                    if r.status_code == 200:
                        data = r.json()
                        count = data.get("totalDocs", len(data.get("docs", [])))
                        manifest.collections.append(
                            CollectionInfo(coll_slug, label, count))
                except Exception:
                    pass

            # Pages = portal_pages
            for ci in manifest.collections:
                if ci.key == "portal_pages":
                    manifest.pages = PageInfo(count=ci.count, has_tree=False)
                    break

            # Media
            try:
                r = await client.get(f"{url}/api/media?limit=0")
                if r.status_code == 200:
                    data = r.json()
                    manifest.media = MediaInfo(
                        count=data.get("totalDocs", 0),
                        total_size_bytes=0,
                    )
            except Exception:
                pass

        return manifest

    async def import_data(
        self,
        config: dict,
        mapping: ImportMapping,
        tenant_id: UUID,
        db: AsyncSession,
        on_progress: ProgressCallback | None = None,
    ) -> ImportResult:
        url = config["url"].rstrip("/")
        result = ImportResult()

        def progress(msg: str, current: int = 0, total: int = 0):
            if on_progress:
                on_progress(msg, current, total)

        async with httpx.AsyncClient(timeout=15) as client:
            # 1. Import globals
            if mapping.globals:
                progress("Globals importieren...", 0, len(mapping.globals))
                for i, slug in enumerate(mapping.globals):
                    try:
                        r = await client.get(f"{url}/api/globals/{slug}?depth=1")
                        if r.status_code != 200:
                            result.warnings.append(f"Global {slug}: HTTP {r.status_code}")
                            continue
                        data = r.json()
                        for key in ("id", "globalType", "createdAt", "updatedAt"):
                            data.pop(key, None)
                        data = _clean_urls(data)
                        await self._upsert_global(slug, slug.replace("-", " ").title(),
                                                  data, tenant_id, db, result, mapping.conflict)
                    except Exception as e:
                        result.errors.append(f"Global {slug}: {e}")
                    progress("Globals importieren...", i + 1, len(mapping.globals))

            # 2. Import pages (from portal_pages)
            if mapping.import_pages and "portal_pages" in mapping.collections:
                try:
                    r = await client.get(f"{url}/api/portal_pages?limit=50&depth=1")
                    if r.status_code == 200:
                        docs = r.json().get("docs", [])
                        progress("Pages importieren...", 0, len(docs))
                        for i, doc in enumerate(docs):
                            try:
                                await self._import_portal_page(doc, tenant_id, db,
                                                               result, mapping.conflict)
                            except Exception as e:
                                result.errors.append(f"Page {doc.get('path', '?')}: {e}")
                            progress("Pages importieren...", i + 1, len(docs))
                except Exception as e:
                    result.errors.append(f"Portal Pages: {e}")

            # 3. Import collection items
            coll_mapping = {
                "reise-themen": ("reise-themen", "Reise-Themen", "Reise-Thema", "Tag"),
                "spezial-reisen": ("spezial-reisen", "Spezial-Reisen", "Spezial-Reise", "Star"),
                "team-members": ("team-members", "Team", "Team Member", "Users"),
            }
            for coll_key in mapping.collections:
                if coll_key == "portal_pages":
                    continue  # handled above as pages
                meta = coll_mapping.get(coll_key)
                if not meta:
                    result.warnings.append(f"Unbekannte Collection: {coll_key}")
                    continue
                cms_key, label, label_s, icon = meta
                try:
                    r = await client.get(f"{url}/api/{coll_key}?limit=100&depth=1")
                    if r.status_code != 200:
                        result.warnings.append(f"Collection {coll_key}: HTTP {r.status_code}")
                        continue
                    docs = r.json().get("docs", [])
                    progress(f"{label} importieren...", 0, len(docs))

                    # Ensure schema exists
                    await self._ensure_schema(cms_key, label, label_s, icon,
                                              tenant_id, db)

                    for i, doc in enumerate(docs):
                        try:
                            await self._import_collection_item(
                                cms_key, coll_key, doc, tenant_id, db,
                                result, mapping.conflict)
                        except Exception as e:
                            result.errors.append(f"{cms_key}/{doc.get('slug', '?')}: {e}")
                        progress(f"{label} importieren...", i + 1, len(docs))
                except Exception as e:
                    result.errors.append(f"Collection {coll_key}: {e}")

        await db.flush()
        progress("Import abgeschlossen", 1, 1)
        return result

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
                result.warnings.append(f"Global {slug}: existiert, uebersprungen")
                return
            obj.data = data
            obj.label = label
            result.globals_updated += 1
        else:
            db.add(CmsGlobal(slug=slug, label=label, data=data, tenant_id=tenant_id))
            result.globals_created += 1

    async def _import_portal_page(
        self, doc: dict, tenant_id: UUID, db: AsyncSession,
        result: ImportResult, conflict: str,
    ):
        path = doc.get("path", "")
        slug = path.strip("/").split("/")[-1] or "home"

        existing = await db.execute(
            select(CmsPage).where(
                CmsPage.path == path, CmsPage.tenant_id == tenant_id)
        )
        page = existing.scalar_one_or_none()
        if page:
            if conflict == "skip":
                return
            if conflict == "overwrite":
                page.hero = self._build_hero(doc)
                page.seo = self._build_seo(doc)
                page.page_type = doc.get("pageType", "listing")
                result.pages_updated += 1
            return

        # Check slug conflict
        slug_check = await db.execute(
            select(CmsPage.id).where(
                CmsPage.slug == slug, CmsPage.tenant_id == tenant_id)
        )
        if slug_check.scalar_one_or_none():
            result.warnings.append(f"Slug '{slug}' belegt, Page {path} uebersprungen")
            return

        from datetime import datetime, timezone
        page = CmsPage(
            title=doc.get("title", slug.replace("-", " ").title()),
            slug=slug,
            path=path,
            page_type=doc.get("pageType", "listing"),
            status="published",
            seo=self._build_seo(doc),
            hero=self._build_hero(doc),
            sections=[],
            tenant_id=tenant_id,
            published_at=datetime.now(timezone.utc),
        )
        db.add(page)
        result.pages_created += 1

    def _build_hero(self, doc: dict) -> dict:
        payload_hero = doc.get("hero") or {}
        hero: dict = {}
        if payload_hero.get("h1"):
            hero["h1"] = payload_hero["h1"]
        if payload_hero.get("subline"):
            hero["subline"] = payload_hero["subline"]

        payload_listing = doc.get("listing") or {}
        listing: dict = {}
        pre = payload_listing.get("preFilters") or {}
        if pre.get("type"):
            listing["preType"] = pre["type"]
        for key in ("defaultSort", "pageSize", "showFilters", "showIntroAboveListing"):
            if payload_listing.get(key) is not None:
                listing[key] = payload_listing[key]
        if listing:
            hero["listing"] = listing

        payload_cur = doc.get("curation") or {}
        curation: dict = {}
        if payload_cur.get("showFeaturedBlock") is not None:
            curation["showFeaturedBlock"] = payload_cur["showFeaturedBlock"]
        if payload_cur.get("featuredBlockTitle"):
            curation["featuredBlockTitle"] = payload_cur["featuredBlockTitle"]
        ids = payload_cur.get("featuredReiseIds", [])
        if ids:
            curation["featuredReiseIds"] = [
                item.get("value", item) if isinstance(item, dict) else item
                for item in ids
            ]
        if curation:
            hero["curation"] = curation

        return hero

    def _build_seo(self, doc: dict) -> dict:
        payload_seo = doc.get("seo") or {}
        seo: dict = {}
        if payload_seo.get("title"):
            seo["title"] = payload_seo["title"]
        if payload_seo.get("description"):
            seo["description"] = payload_seo["description"]
        return seo

    async def _ensure_schema(
        self, key: str, label: str, label_s: str, icon: str,
        tenant_id: UUID, db: AsyncSession,
    ):
        existing = await db.execute(
            select(CmsCollectionSchema).where(
                CmsCollectionSchema.collection_key == key,
                CmsCollectionSchema.tenant_id == tenant_id)
        )
        if existing.scalar_one_or_none():
            return
        db.add(CmsCollectionSchema(
            collection_key=key, label=label, label_singular=label_s,
            icon=icon, fields=[], tenant_id=tenant_id,
        ))
        await db.flush()

    async def _import_collection_item(
        self, cms_key: str, payload_key: str, doc: dict,
        tenant_id: UUID, db: AsyncSession,
        result: ImportResult, conflict: str,
    ):
        name = doc.get("name", doc.get("title", ""))
        slug = doc.get("slug", name.lower().replace(" ", "-"))

        existing = await db.execute(
            select(CmsCollection).where(
                CmsCollection.collection_key == cms_key,
                CmsCollection.slug == slug,
                CmsCollection.tenant_id == tenant_id)
        )
        if existing.scalar_one_or_none():
            if conflict == "skip":
                return
            # overwrite not implemented for items yet
            return

        if cms_key == "team-members":
            data = {
                "name": name,
                "rolle": doc.get("role", doc.get("rolle", "")),
                "telefon": doc.get("telefon", doc.get("phone", "")),
                "email": doc.get("email", ""),
                "bio": doc.get("bio", doc.get("description", "")),
            }
            foto = doc.get("foto") or doc.get("image")
            if isinstance(foto, dict) and foto.get("url"):
                data["foto_url"] = _clean_urls(foto["url"])
        else:
            data = {
                "name": name,
                "slug": slug,
                "api_filter": doc.get("apiFilter", name),
                "beschreibung": doc.get("introText", ""),
                "seo_title": doc.get("seoTitle", ""),
                "seo_description": doc.get("seoDescription", ""),
            }

        db.add(CmsCollection(
            collection_key=cms_key, title=name, slug=slug,
            data=data, status="published",
            sort_order=doc.get("sortOrder", 0),
            tenant_id=tenant_id,
        ))
        result.items_created += 1
