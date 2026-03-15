# Sprint: Content i18n — Phase 1 (Backend Core)

**Issue:** #1 Content i18n
**Prioritaet:** CRITICAL
**Phase:** Phase 1, Wochen 1-2
**Status:** DONE

---

## Ziel

Field-Level i18n mit `?locale=` Parameter auf allen Delivery-Endpoints.
Fallback-Ketten (de-AT → de → en). Backwards-compatible (ohne locale = unveraendert).

---

## Tasks

### Runde 1: DB-Schema + Core Service (~0.5 Tag)

| # | Task | Datei(en) | Status |
|---|------|-----------|--------|
| 1.1 | `translations` JSONB Spalte auf CmsPage | backend/app/models/page.py | DONE |
| 1.2 | `translations` JSONB Spalte auf CmsCollection | backend/app/models/collection.py | DONE |
| 1.3 | `translations` JSONB Spalte auf CmsGlobal | backend/app/models/global_config.py | DONE |
| 1.4 | `locales` + `fallback_chain` auf CmsTenant | backend/app/models/tenant.py | DONE |
| 1.5 | Alembic Migration `001_add_i18n_columns` | backend/migrations/versions/001_add_i18n_columns.py | DONE |
| 1.6 | Core i18n Service (validate, fallback, merge, completeness) | backend/app/core/content_i18n.py | DONE |

### Runde 2: Delivery API Locale-Support (~1 Tag)

| # | Task | Datei(en) | Status |
|---|------|-----------|--------|
| 2.1 | `LocaleParams` Dataclass | backend/app/delivery/query_params.py | DONE |
| 2.2 | `get_delivery_tenant()` Dependency (volles Tenant-Objekt) | backend/app/delivery/tenant_resolver.py | DONE |
| 2.3 | Pages: `?locale=` auf GET /pages/{slug}, GET /pages, GET /tree | backend/app/delivery/pages.py | DONE |
| 2.4 | Pages Batch: `locale` im POST Body | backend/app/delivery/pages.py | DONE |
| 2.5 | Collections: `?locale=` auf GET /collections/{key} | backend/app/delivery/collections.py | DONE |
| 2.6 | Globals: `?locale=` auf GET /globals/, GET /globals/{slug} | backend/app/delivery/globals.py | DONE |

### Runde 3: Neue Endpoints + Admin API (~1 Tag)

| # | Task | Datei(en) | Status |
|---|------|-----------|--------|
| 3.1 | GET /content/locales — Tenant-Locales | backend/app/delivery/locales.py (NEU) | DONE |
| 3.2 | GET /content/pages/{slug}/locales — Completeness | backend/app/delivery/locales.py | DONE |
| 3.3 | Router in main.py registrieren | backend/app/main.py | DONE |
| 3.4 | Translation Service (CRUD) | backend/app/services/translation_service.py (NEU) | DONE |
| 3.5 | Admin: GET/PUT /pages/{id}/translations/{locale} | backend/app/api/pages.py | DONE |
| 3.6 | Admin: GET/PUT /collections/{key}/items/{id}/translations/{locale} | backend/app/api/collections.py | DONE |
| 3.7 | Admin: GET/PUT /globals/{slug}/translations/{locale} | backend/app/api/globals.py | DONE |
| 3.8 | Admin: PUT /tenants/{id}/locales | backend/app/api/tenants.py | DONE |
| 3.9 | Pydantic Schemas (PageTranslationUpdate, CollectionTranslationUpdate, GlobalTranslationUpdate) | backend/app/schemas/*.py | DONE |

### Runde 4: SDK v0.3 (~0.5 Tag)

| # | Task | Datei(en) | Status |
|---|------|-----------|--------|
| 4.1 | Types: LocaleMetadata, locale auf Config + Params | packages/contypio-client/src/types.ts | DONE |
| 4.2 | Pages Resource: locale Param + locales() Methode | packages/contypio-client/src/resources/pages.ts | DONE |
| 4.3 | Collections Resource: locale Param | packages/contypio-client/src/resources/collections.ts | DONE |
| 4.4 | Globals Resource: locale Param | packages/contypio-client/src/resources/globals.ts | DONE |
| 4.5 | Locales Resource (NEU) | packages/contypio-client/src/resources/locales.ts | DONE |
| 4.6 | Client: locales Resource registrieren | packages/contypio-client/src/client.ts | DONE |
| 4.7 | package.json: Version 0.2.0 → 0.3.0 | packages/contypio-client/package.json | DONE |

---

## Datenmodell

### translations JSONB (CmsPage)
```json
{
  "de": {
    "title": "Startseite",
    "seo": {"title": "Willkommen", "description": "..."},
    "hero": {"headline": "Willkommen"},
    "sections": [...]
  }
}
```

### translations JSONB (CmsCollection)
```json
{
  "de": {
    "title": "Isfahan Tagestour",
    "data": {"description": "Deutsch", "highlights": ["..."]}
  }
}
```

### Fallback-Kette
```
de-AT → de → en (Tenant-Default)
Custom: tenant.fallback_chain = {"de-AT": ["de", "en"]}
Auto: Region strippen → Default
```

### Response _locale Metadata
```json
{
  "_locale": {
    "requested": "de-AT",
    "resolved": "de",
    "fallbacks_used": {"seo.description": "en"}
  }
}
```

---

## Abhaengigkeiten

- Keine externen Dependencies
- Alembic Migration muss auf Production laufen
- Deploy: `./infrastructure/deploy/deploy.sh sync backend`

---

## Verifikation

1. Migration laeuft ohne Fehler
2. `GET /content/pages/homepage` — unveraendert (backwards-compatible)
3. `GET /content/pages/homepage?locale=de` — deutsche Uebersetzung
4. `GET /content/pages/homepage?locale=de-AT` — Fallback auf de
5. `GET /content/locales` — Tenant-Locales
6. `GET /content/pages/homepage/locales` — Completeness Scores
7. SDK: `client.pages.get("homepage", { locale: "de" })` — funktioniert
