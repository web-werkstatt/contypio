#!/usr/bin/env python3
"""
Payload -> Python CMS Migration Script (L8.1)

Migriert:
1. Globals (agb, datenschutz, impressum, kontakt, service + uebersicht-settings)
2. Portal Pages (listing config -> cms_pages hero JSON)
3. Collection Items (reise-themen, spezial-reisen, team-members)

Idempotent: Kann mehrfach laufen (upsert by slug).
"""

import subprocess
import sys
import requests

PAYLOAD_URL = "http://localhost:8057"
CMS_URL = "http://localhost:8060"
CMS_EMAIL = "admin@ir-tours.de"
CMS_PASSWORD = "changeme"
TENANT_ID = "b577daf1-fc19-44cb-8eb8-84052c749735"

# DB access via docker exec
DB_CMD = ["docker", "exec", "cms-postgres", "psql", "-U", "cms_user", "-d", "cms_db", "-t", "-A"]


def run_sql(sql: str) -> str:
    """Run SQL via docker exec."""
    result = subprocess.run(DB_CMD + ["-c", sql], capture_output=True, text=True)
    return result.stdout.strip()


def get_cms_token() -> str:
    r = requests.post(f"{CMS_URL}/api/auth/login", json={
        "email": CMS_EMAIL, "password": CMS_PASSWORD,
    })
    r.raise_for_status()
    return r.json()["access_token"]


def headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def fetch_payload_global(slug: str) -> dict | None:
    try:
        r = requests.get(f"{PAYLOAD_URL}/api/globals/{slug}?depth=1", timeout=5)
        if r.ok:
            data = r.json()
            for key in ("id", "globalType", "createdAt", "updatedAt"):
                data.pop(key, None)
            return clean_payload_urls(data)
    except Exception as e:
        print(f"  ERROR: {slug}: {e}")
    return None


def clean_payload_urls(data):
    """Replace Payload media URLs with relative paths."""
    if isinstance(data, str):
        if "localhost:8057" in data or "192.168.100.93:8057" in data:
            parts = data.split("/")
            return f"/images/payload/{parts[-1]}"
        return data
    elif isinstance(data, dict):
        return {k: clean_payload_urls(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_payload_urls(item) for item in data]
    return data


def migrate_globals(token: str):
    """Migrate Payload globals to Python CMS."""
    print("\n=== Migrating Globals ===")

    globals_to_migrate = [
        ("agb-page-settings", "AGB"),
        ("datenschutz-page-settings", "Datenschutz"),
        ("impressum-page-settings", "Impressum"),
        ("kontakt-page-settings", "Kontakt"),
        ("service-page-settings", "Service"),
        ("reisethemen-uebersicht-settings", "Reisethemen Uebersicht"),
        ("reiseziele-uebersicht-settings", "Reiseziele Uebersicht"),
    ]

    migrated = 0
    for slug, label in globals_to_migrate:
        data = fetch_payload_global(slug)
        if not data:
            print(f"  SKIP: {slug} (not in Payload)")
            continue

        import json
        data_json = json.dumps(data).replace("'", "''")

        # Check if exists
        exists = run_sql(f"SELECT id FROM cms_globals WHERE slug = '{slug}' AND tenant_id = '{TENANT_ID}'")

        if exists:
            # Update
            run_sql(f"UPDATE cms_globals SET data = '{data_json}'::jsonb, label = '{label}', updated_at = NOW() WHERE slug = '{slug}' AND tenant_id = '{TENANT_ID}'")
            print(f"  Updated: {slug}")
        else:
            # Insert
            run_sql(f"INSERT INTO cms_globals (slug, label, data, tenant_id, updated_at) VALUES ('{slug}', '{label}', '{data_json}'::jsonb, '{TENANT_ID}', NOW())")
            print(f"  Created: {slug}")
        migrated += 1

    # Also update site-settings with full Payload data
    site_data = fetch_payload_global("site-settings")
    if site_data:
        import json
        # Merge with existing Python CMS site-settings
        existing_raw = run_sql(f"SELECT data::text FROM cms_globals WHERE slug = 'site-settings' AND tenant_id = '{TENANT_ID}'")
        existing = json.loads(existing_raw) if existing_raw else {}
        # Map Payload fields
        merged = {
            **existing,
            "site_name": site_data.get("firmenname", existing.get("site_name", "")),
            "address": site_data.get("adresse", existing.get("address", "")),
            "contact_phone": site_data.get("telefon", existing.get("contact_phone", "")),
            "contact_mobile": site_data.get("mobil", ""),
            "contact_email": site_data.get("email", existing.get("contact_email", "")),
            "opening_hours": site_data.get("oeffnungszeiten", ""),
        }
        if site_data.get("socialLinks"):
            for link in site_data["socialLinks"]:
                if link.get("platform") == "facebook":
                    merged["facebook"] = link.get("url", "")
                elif link.get("platform") == "google":
                    merged["google_reviews"] = link.get("url", "")
        merged_json = json.dumps(merged).replace("'", "''")
        run_sql(f"UPDATE cms_globals SET data = '{merged_json}'::jsonb, updated_at = NOW() WHERE slug = 'site-settings' AND tenant_id = '{TENANT_ID}'")
        print(f"  Updated: site-settings (merged)")
        migrated += 1

    print(f"  Total: {migrated} globals migrated")


def migrate_portal_pages(token: str):
    """Migrate portal pages to Python CMS pages."""
    print("\n=== Migrating Portal Pages ===")
    h = headers(token)

    try:
        r = requests.get(f"{PAYLOAD_URL}/api/portal_pages?limit=50&depth=1", timeout=10)
        if not r.ok:
            print(f"  ERROR: Payload returned {r.status_code}")
            return
        docs = r.json().get("docs", [])
    except Exception as e:
        print(f"  ERROR: {e}")
        return

    if not docs:
        print("  No portal pages found")
        return

    migrated = 0
    for doc in docs:
        path = doc.get("path", "")
        slug = path.strip("/").split("/")[-1] or "home"
        title = doc.get("title", slug.replace("-", " ").title())

        # Check if page already exists by path
        existing = run_sql(f"SELECT id FROM cms_pages WHERE path = '{path}' AND tenant_id = '{TENANT_ID}'")
        if existing:
            print(f"  EXISTS: {path}")
            continue

        # Also check slug conflict
        slug_exists = run_sql(f"SELECT id FROM cms_pages WHERE slug = '{slug}' AND tenant_id = '{TENANT_ID}'")
        if slug_exists:
            print(f"  CONFLICT: slug '{slug}' already used, skipping {path}")
            continue

        # Build hero JSON from Payload nested structure
        payload_hero = doc.get("hero", {}) or {}
        hero = {}
        if payload_hero.get("h1"):
            hero["h1"] = payload_hero["h1"]
        if payload_hero.get("subline"):
            hero["subline"] = payload_hero["subline"]

        # Listing config from Payload nested structure
        payload_listing = doc.get("listing", {}) or {}
        listing = {}
        pre_filters = payload_listing.get("preFilters", {}) or {}
        if pre_filters.get("type"):
            listing["preType"] = pre_filters["type"]
        if payload_listing.get("filterPresetId"):
            listing["filterPresetId"] = payload_listing["filterPresetId"]
        if payload_listing.get("defaultSort"):
            listing["defaultSort"] = payload_listing["defaultSort"]
        if payload_listing.get("pageSize"):
            listing["pageSize"] = payload_listing["pageSize"]
        if payload_listing.get("showFilters") is not None:
            listing["showFilters"] = payload_listing["showFilters"]
        if payload_listing.get("showIntroAboveListing") is not None:
            listing["showIntroAboveListing"] = payload_listing["showIntroAboveListing"]
        if listing:
            hero["listing"] = listing

        # Curation from Payload nested structure
        payload_curation = doc.get("curation", {}) or {}
        curation = {}
        if payload_curation.get("showFeaturedBlock") is not None:
            curation["showFeaturedBlock"] = payload_curation["showFeaturedBlock"]
        if payload_curation.get("featuredBlockTitle"):
            curation["featuredBlockTitle"] = payload_curation["featuredBlockTitle"]
        # Featured Reise IDs
        featured_ids = payload_curation.get("featuredReiseIds", [])
        if featured_ids:
            curation["featuredReiseIds"] = [
                item.get("value", item) if isinstance(item, dict) else item
                for item in featured_ids
            ]
        if curation:
            hero["curation"] = curation

        # SEO from Payload nested structure
        payload_seo = doc.get("seo", {}) or {}
        seo = {}
        if payload_seo.get("title"):
            seo["title"] = payload_seo["title"]
        if payload_seo.get("description"):
            seo["description"] = payload_seo["description"]

        page_data = {
            "title": title,
            "slug": slug,
            "path": path,
            "page_type": doc.get("page_type", "listing"),
            "seo": seo,
            "hero": hero,
            "sections": [],
        }

        r = requests.post(f"{CMS_URL}/api/pages", headers=h, json=page_data)
        if r.status_code in (200, 201):
            page_id = r.json().get("id")
            requests.post(f"{CMS_URL}/api/pages/{page_id}/publish", headers=h)
            print(f"  Created: {path} (id={page_id})")
            migrated += 1
        else:
            print(f"  WARN: {path} failed ({r.status_code}): {r.text[:120]}")

    print(f"  Total: {migrated}/{len(docs)} portal pages migrated")


def migrate_collection_items(token: str):
    """Migrate reise-themen, spezial-reisen, team-members to Python CMS."""
    print("\n=== Migrating Collection Items ===")
    h = headers(token)

    # Ensure schemas exist for reise-themen and spezial-reisen
    for key, label, label_s, icon in [
        ("reise-themen", "Reise-Themen", "Reise-Thema", "Tag"),
        ("spezial-reisen", "Spezial-Reisen", "Spezial-Reise", "Star"),
    ]:
        existing = run_sql(f"SELECT id FROM cms_collection_schemas WHERE collection_key = '{key}' AND tenant_id = '{TENANT_ID}'")
        if not existing:
            schema_data = {
                "collection_key": key,
                "label": label,
                "label_singular": label_s,
                "icon": icon,
                "fields": [
                    {"name": "name", "label": "Name", "type": "text", "required": True},
                    {"name": "slug", "label": "Slug", "type": "text", "required": True},
                    {"name": "api_filter", "label": "API Filter", "type": "text"},
                    {"name": "beschreibung", "label": "Beschreibung", "type": "textarea"},
                    {"name": "seo_title", "label": "SEO Title", "type": "text"},
                    {"name": "seo_description", "label": "SEO Description", "type": "textarea"},
                ],
                "title_field": "name",
                "slug_field": "slug",
            }
            r = requests.post(f"{CMS_URL}/api/collections", headers=h, json=schema_data)
            if r.status_code in (200, 201):
                print(f"  Created schema: {key}")
            else:
                print(f"  WARN: Schema {key} failed ({r.status_code}): {r.text[:100]}")

    collections = {
        "reise-themen": "reise-themen",
        "spezial-reisen": "spezial-reisen",
        "team-members": "team-members",
    }

    for payload_key, cms_key in collections.items():
        try:
            r = requests.get(f"{PAYLOAD_URL}/api/{payload_key}?limit=100&depth=1", timeout=10)
            if not r.ok:
                print(f"  SKIP: {payload_key} (Payload returned {r.status_code})")
                continue
            docs = r.json().get("docs", [])
        except Exception as e:
            print(f"  ERROR: {payload_key}: {e}")
            continue

        created = 0
        for doc in docs:
            name = doc.get("name", doc.get("title", ""))
            slug = doc.get("slug", name.lower().replace(" ", "-"))

            # Check if already exists
            existing = run_sql(
                f"SELECT id FROM cms_collections WHERE collection_key = '{cms_key}' "
                f"AND slug = '{slug}' AND tenant_id = '{TENANT_ID}'"
            )
            if existing:
                print(f"  EXISTS: {cms_key}/{slug}")
                continue

            item_data = {
                "title": name,
                "slug": slug,
                "data": {},
                "sort_order": doc.get("sortOrder", 0),
            }

            if cms_key == "team-members":
                item_data["data"] = {
                    "name": name,
                    "rolle": doc.get("role", doc.get("rolle", "")),
                    "telefon": doc.get("telefon", doc.get("phone", "")),
                    "email": doc.get("email", ""),
                    "bio": doc.get("bio", doc.get("description", "")),
                }
                foto = doc.get("foto") or doc.get("image")
                if isinstance(foto, dict) and foto.get("url"):
                    item_data["data"]["foto_url"] = clean_payload_urls(foto["url"])
            else:
                item_data["data"] = {
                    "name": name,
                    "slug": slug,
                    "api_filter": doc.get("apiFilter", name),
                    "beschreibung": doc.get("introText", ""),
                    "seo_title": doc.get("seoTitle", ""),
                    "seo_description": doc.get("seoDescription", ""),
                }

            r = requests.post(f"{CMS_URL}/api/collections/{cms_key}/items", headers=h, json=item_data)
            if r.status_code in (200, 201):
                print(f"  Created: {cms_key}/{slug}")
                created += 1
            else:
                print(f"  WARN: {cms_key}/{slug} ({r.status_code}): {r.text[:100]}")

        print(f"  {cms_key}: {created}/{len(docs)} items migrated")


def main():
    print("=== Payload -> Python CMS Migration ===")

    # Test connectivity
    try:
        r = requests.get(f"{PAYLOAD_URL}/api/globals/site-settings", timeout=5)
        assert r.ok, f"Payload returned {r.status_code}"
    except Exception as e:
        print(f"ERROR: Payload not reachable: {e}")
        sys.exit(1)

    try:
        r = requests.get(f"{CMS_URL}/health", timeout=5)
        assert r.ok
    except Exception:
        print("ERROR: Python CMS not reachable")
        sys.exit(1)

    token = get_cms_token()
    print("  Auth: OK")

    migrate_globals(token)
    migrate_portal_pages(token)
    migrate_collection_items(token)

    print("\n=== Migration Complete ===")


if __name__ == "__main__":
    main()
