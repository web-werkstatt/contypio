# Contypio Delivery API — Erweiterungskonzept v1.0

> **Status:** Approved
> **Autor:** Joseph / web-werkstatt.at
> **Datum:** 2026-03-15
> **Zweck:** Verbindliche Spezifikation fuer API-Erweiterungen. Dient als Vertrag zwischen Backend-Entwicklung und SDK v0.2.

---

## Uebersicht

Dieses Dokument spezifiziert sechs API-Erweiterungen, die aus der Gap-Analyse der bestehenden Delivery API abgeleitet wurden. Jede Erweiterung ist als eigenstaendiges Feature beschrieben, das unabhaengig implementiert werden kann.

### Priorisierung

| # | Feature | Prioritaet | Begruendung |
|---|---------|-----------|------------|
| 1 | Batch-Endpoints | **Hoch** | SSG-Build-Performance, Rate-Limit-Entlastung |
| 2 | Content Localization (i18n) | **Hoch** | Blockiert internationalen Marktzugang |
| 3 | Cursor-Pagination | **Mittel** | Skalierung bei grossen Collections (>1000 Items) |
| 4 | Relation Depth Control | **Mittel** | Overfetching vermeiden, Response-Groesse kontrollieren |
| 5 | Schema-Endpoint | **Mittel** | Grundlage fuer SDK Auto-Type-Generation |
| 6 | API-Versionierung | **Mittel** | Langfristige Stabilitaet fuer Konsumenten |

---

## 1. Batch-Endpoints

### Problem

SSG-Frameworks (Astro, Next.js) muessen beim Build oft 50-500 Seiten fetchen. Aktuell erfordert das N einzelne Requests, was bei einem Rate Limit von 100 req/min zum Bottleneck wird. Ein Build mit 200 Seiten dauert mindestens 2 Minuten — nur durch Rate Limiting.

### Spezifikation

#### `POST /content/pages/batch`

Mehrere Seiten in einem Request abrufen. Sections werden vollstaendig aufgeloest (wie bei Einzel-Page-Abruf).

**Request:**

```http
POST /content/pages/batch
Content-Type: application/json

{
  "slugs": ["homepage", "about", "contact", "blog"],
  "fields": "title,seo,sections"
}
```

**Request Body:**

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `slugs` | `string[]` | Ja | Liste von Page-Slugs (max. 50) |
| `fields` | `string` | Nein | Sparse Fields (wie bei Einzel-Endpoint) |
| `include_css` | `boolean` | Nein | CSS fuer Grid-Layouts einbeziehen (default: false) |

**Response: `200 OK`**

```json
{
  "items": [
    {
      "id": 1,
      "title": "Homepage",
      "slug": "homepage",
      "path": "/",
      "page_type": "content",
      "seo": { "title": "Welcome", "description": "Our homepage" },
      "sections": [],
      "published_at": "2026-03-15T10:00:00"
    },
    {
      "id": 5,
      "title": "About",
      "slug": "about",
      "path": "/about",
      "page_type": "content",
      "seo": {},
      "sections": [],
      "published_at": "2026-03-10T08:00:00"
    }
  ],
  "requested": 4,
  "found": 4,
  "missing": []
}
```

Fehlende Slugs fuehren **nicht** zu einem Fehler — der Endpoint liefert alle gefundenen Seiten und listet fehlende separat auf.

**Errors:**

| Status | Bedingung |
|--------|-----------|
| 400 | `slugs` fehlt, leer, oder > 50 Eintraege |
| 401 | Ungueltiger API-Key (wenn Seiten geschuetzt) |
| 422 | Ungueltige `fields`-Werte |

**Rate Limiting:** Ein Batch-Request zaehlt als **1 Request**, nicht als N.

#### `POST /content/collections/{key}/batch`

Mehrere Collection-Items per ID oder Slug abrufen.

**Request Body:**

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `ids` | `integer[]` | Ja* | Liste von Item-IDs (max. 100) |
| `slugs` | `string[]` | Ja* | Alternativ: Liste von Slugs (max. 100) |
| `fields` | `string` | Nein | Sparse Fields |

\* Genau eines von `ids` oder `slugs` muss angegeben werden.

**Response:** Identische Struktur wie Pages-Batch mit `items`, `requested`, `found`, `missing`.

---

## 2. Content Localization (i18n)

### Design-Entscheidung: Field-Level

Field-Level i18n passt besser zum bestehenden `data`-JSON-Modell. Uebersetzbare Felder werden pro Locale gespeichert, nicht-uebersetzbare (Preis, Koordinaten) bleiben global.

### Spezifikation

#### Locale-Parameter auf allen Endpoints

```http
GET /content/pages/homepage?locale=de
GET /content/collections/tours?locale=de
POST /content/pages/batch  (Body: { "slugs": [...], "locale": "de" })
```

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `locale` | `string` | Server-Default | IETF BCP 47 Locale (z.B. `de`, `en`, `de-AT`) |

#### Fallback-Kette

```
de-AT -> de -> en (Server-Default)
```

#### Response-Erweiterung

```json
{
  "id": 1,
  "title": "Startseite",
  "_locale": {
    "requested": "de",
    "resolved": "de",
    "fallbacks_used": {}
  }
}
```

#### Neue Endpoints

- `GET /content/locales` — Alle verfuegbaren Locales
- `GET /content/pages/{slug}/locales` — Locale-Varianten einer Seite mit `completeness` (0.0-1.0)

---

## 3. Cursor-Pagination

Cursor-Pagination wird **zusaetzlich** zur bestehenden Offset-Pagination angeboten. Kein Breaking Change.

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `cursor` | `string` | Opaker Cursor-Token (Base64-encoded) |
| `limit` | `integer` | Items pro Seite (1-100, Default: 20) |

Leerer `cursor`-String = "ab Anfang mit Cursor-Modus".

**Cursor-Struktur (intern):** Base64-encoded JSON mit letztem Sort-Wert und ID als Tiebreaker.

**Einschraenkung:** Ein Cursor ist nur gueltig fuer die Filter/Sort-Kombination, mit der er erzeugt wurde.

---

## 4. Relation Depth Control

| Parameter | Typ | Default | Range | Beschreibung |
|-----------|-----|---------|-------|--------------|
| `depth` | `integer` | 2 | 0-5 | Maximale Tiefe der Relation-Aufloesung |

| Depth | Verhalten |
|-------|-----------|
| `0` | Keine Relations aufgeloest. Media-IDs bleiben als `imageId: 42`. |
| `1` | Direkte Relations aufgeloest. Verschachtelte Relations als ID. |
| `2` | **(Default)** Zwei Ebenen tief. Aktuelles Verhalten. |
| `3-5` | Tiefere Aufloesung fuer komplexe Datenmodelle. |

---

## 5. Schema-Endpoint

#### `GET /content/schema/{collection_key}`

Liefert das Schema einer Collection: Felder, Typen, Validierungen, Relationen. Oeffentlich (ohne Auth) — noetig fuer Codegen-Tooling.

#### `GET /content/schema`

Alle Collection-Schemas auf einmal (fuer Codegen-Tooling).

**Caching:** `Cache-Control: public, max-age=300, stale-while-revalidate=600`

---

## 6. API-Versionierung

**Ansatz: URL-Prefix** (`/api/v1/content/...`)

#### Migrationspfad

1. **Phase 1:** Beide Pfade aktiv — `/content/...` und `/api/v1/content/...`
2. **Phase 2:** `/content/...` gibt `Deprecation: true`-Header zurueck
3. **Phase 3:** `/content/...` liefert `301 Moved Permanently`

#### Response-Header

```http
X-API-Version: 1
Sunset: Sat, 15 Mar 2028 00:00:00 GMT   (nur bei deprecated Versionen)
Deprecation: true                         (nur bei deprecated Versionen)
```

---

## Implementierungs-Reihenfolge

```
Phase 1 (Wochen 1-3):  Batch-Endpoints
Phase 2 (Wochen 3-5):  Schema-Endpoint + API-Versionierung
Phase 3 (Wochen 5-8):  Cursor-Pagination + Depth Control
Phase 4 (Wochen 8-14): Content Localization (i18n)
```

---

## Breaking vs. Non-Breaking Changes

### Streng additiv (Non-Breaking)

| Feature | Warum Non-Breaking |
|---------|-------------------|
| Batch-Endpoints | Neuer Endpoint, bestehende unveraendert |
| Schema-Endpoint | Neuer Endpoint, rein additiv |
| Cursor-Pagination | Aktivierung nur bei Verwendung des `cursor`-Params |
| Depth Control | Neuer optionaler Query-Parameter. Default `2` = aktuelles Verhalten |
| Locale-Parameter | Neuer optionaler Parameter. Ohne `locale` = bisheriges Verhalten |
| Security Headers (S1) | Rein additiv |

### Potenziell Breaking

| Feature | Was bricht | Migrationspfad | Zeitfenster |
|---------|-----------|----------------|-------------|
| **Batch-Response-Format** | Map -> Array Umbau | `?format=map` (deprecated) / `?format=array` (default) | 8 Wochen |
| **API-Versionierung** | Pfadaenderung | Phase 1-3 mit Deprecation Headers | 6+ Monate |
| **Filter-Allowlist** (S4) | Clients mit nicht-erlaubten Feldern | Logging vor Enforcement | 2 Wochen |
| **Key-Hashing** (S5) | Klartext-Spalte entfaellt | Automatische Migration | Einmalig |
| **Webhook-Signatur v2** (S8) | Neues HMAC-Format | v1+v2 parallel | 8 Wochen |
| **Content i18n** | Neue Felder | Nur mit API v2 | Mit v2-Release |

---

## SDK v0.2 Scope

| SDK-Version | API-Features vorausgesetzt | Release-Zeitpunkt |
|-------------|--------------------------|-------------------|
| v0.2 | Batch, Cursor, Depth, Schema | Nach API-Phase 1-3 |
| v0.3 | i18n, API-Versionierung (v1) | Nach API-Phase 4 |

---

## Non-Goals / Bewusst nicht in dieser Roadmap

| Feature | Warum nicht jetzt | Fruehestens |
|---------|------------------|------------|
| Global Search | Braucht eigenen Index (Meilisearch) | v2 |
| GraphQL-Layer | Aufwand/Nutzen aktuell nicht gegeben | v2+ |
| Realtime / Subscriptions | Webhooks decken Revalidation ab | v2 |
| Plugin-System / Marketplace | Zu frueh | v3 |
| RBAC-Ausbau | Enterprise-Feature | v2 |
| Draft Preview URLs | Eigenstaendiges Feature | v1.1 |

---

# Teil 2: Security Hardening

> **Grundlage:** OWASP API Security Top 10 2023, Raidiam API Security Report 2025, Curity API Security Trends 2025/2026.

---

## Infrastruktur-Kontext

Contypio laeuft Self-Hosted auf Hetzner mit **Caddy als Reverse Proxy**.

### Was Caddy abdeckt

| Aspekt | Caddy-Verhalten | Auswirkung |
|--------|----------------|------------|
| HTTPS + Let's Encrypt | Automatisch | S2 wird Defense-in-Depth |
| TLS 1.3 | Default | Kein manuelles Tuning |
| HTTP -> HTTPS Redirect | Automatisch | App-Level-Redirect = Fallback |
| HSTS-Header | Via Caddyfile | Besser auf Caddy-Ebene |

### Was Caddy NICHT abdeckt

| Aspekt | Konsequenz |
|--------|------------|
| CORS | Muss in FastAPI bleiben (S3) |
| Rate Limiting | FastAPI = **primaere Verteidigungslinie** (S7) |
| Bot-Detection / WAF | Cloudflare vor Caddy empfohlen |
| API-spezifische Headers | CSP etc. in FastAPI (S1) |

### Empfohlene Caddy-Konfiguration

```caddyfile
cms.example.com {
    reverse_proxy contypio-app:8000
    header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    header X-Content-Type-Options "nosniff"
    header X-Frame-Options "DENY"
    header Referrer-Policy "no-referrer"
}
```

---

## Security-Priorisierung

| # | Massnahme | Sprint | Prioritaet | OWASP-Bezug |
|---|----------|--------|-----------|-------------|
| S1 | Security Response Headers | Sprint 1 | Kritisch | API8:2023 |
| S2 | HTTPS/HSTS Enforcement | Sprint 1 | Defense-in-Depth | API8:2023 |
| S3 | CORS-Konfiguration pro Tenant | Sprint 1 | Kritisch | API8:2023 |
| S4 | Filter-Field-Allowlist | Sprint 1 | Kritisch | API1:2023, API3:2023 |
| S5 | API-Key-Hashing (SHA-256) | Sprint 2 | Hoch | API2:2023 |
| S6 | Key-Rotation mit Grace Period | Sprint 2 | Hoch | API2:2023 |
| S7 | Key-Typen mit Tiered Rate Limits | Sprint 2 | **Kritisch** | API4:2023 |
| S8 | Webhook Replay-Schutz | Sprint 3 | Hoch | API10:2023 |
| S9 | BOPLA-Audit (Response Filtering) | Sprint 3 | Hoch | API3:2023 |
| S10 | Request-Logging / Audit-Trail | Sprint 3 | Mittel | API9:2023 |
| S11 | Search-Input-Sanitization | Sprint 3 | Hoch | API8:2023 |
| S12 | Tenant-Isolation-Audit | Sprint 4 | Hoch | API1:2023, API5:2023 |

---

## Security-Sprint-Uebersicht

```
Sprint 1 (Woche 1-2):  Infrastruktur-Baseline          ~2-3 Tage
                        Headers, CORS, Filter-Allowlist
                        HSTS via Caddyfile, App-Middleware als Fallback

Sprint 2 (Woche 3-4):  Key-Management & Rate Limits     ~4-5 Tage
                        Key-Hashing, Rotation, Tiered Limits
                        Rate Limiter = primaere Verteidigungslinie (kein Caddy-RL)

Sprint 3 (Woche 5-6):  Response-Security & Webhooks     ~4-5 Tage
                        BOPLA, Replay-Schutz, Audit-Log, Search

Sprint 4 (Woche 7-8):  Tenant-Isolation & Audit         ~3 Tage
                        Cross-Tenant-Guard, Pentest, Doku

Gesamt:                                                  ~14-16 Tage
```

---

## Middleware-Reihenfolge (kritisch!)

```python
# main.py — Middleware-Stack (LIFO: letzte wird zuerst ausgefuehrt)
#
# Caddy uebernimmt HTTPS/TLS + HSTS.
# FastAPI-Middleware ist Defense-in-Depth + Caddy-unabhaengige Features.

# 1. HTTPS Fallback (Caddy macht das primaer)
app.add_middleware(HTTPSEnforcementMiddleware)

# 2. Security-Headers (API-spezifische: CSP, Permissions-Policy)
app.add_middleware(SecurityHeadersMiddleware)

# 3. CORS (MUSS in FastAPI — Caddy hat kein CORS-Handling)
app = TenantAwareCORSMiddleware(app)

# 4. Audit-Logging
app.add_middleware(AuditLogMiddleware)

# 5. Rate Limiting — PRIMAERE VERTEIDIGUNGSLINIE
app.add_middleware(TieredRateLimitMiddleware)

# 6. API-Key-Auth
app.add_middleware(APIKeyAuthMiddleware)

# 7. Tenant-Resolution
app.add_middleware(TenantResolutionMiddleware)

# 8. Tenant-Isolation
app.add_middleware(TenantIsolationMiddleware)
```

---

## Entschiedene Fragen

### API-Entscheidungen

| # | Frage | Entscheidung | Begruendung |
|---|-------|-------------|------------|
| 1 | Batch-Response-Format | Array + `missing`-Feld | Einfacher zu iterieren, explizites Fehler-Reporting |
| 2 | Batch-Limit | 50 Slugs / 100 IDs | IR-Tours: 435 Items = 5 Requests |
| 3 | i18n Storage | Nested JSON in `data`-Spalte | Passt zum JSONB-Modell, vermeidet JOINs |
| 4 | Schema-Endpoint | Oeffentlich (ohne Auth) | Noetig fuer Codegen-Tooling |
| 5 | Cursor-Format | Base64-JSON (behalten) | Transparent, debugbar |
| 6 | Global Search | Spaeter (v2+) | Collection-Suche deckt 90% |
| 7 | Batch Rate Limit | 1 Token pro Batch | Hauptvorteil von Batch |

### Security-Entscheidungen

| # | Frage | Entscheidung |
|---|-------|-------------|
| 8 | Redis | In-Memory fuer Start, Redis in Sprint 2 nachziehen |
| 9 | Key-Migration | Automatisch hashen |
| 10 | Webhook v2 | 8 Wochen parallel |
| 11 | Log-Retention | 90d, IP-Anonymisierung nach 7d (DSGVO) |
| 12 | Bot-Detection | Cloudflare vor Caddy (empfohlen) |

### Infrastruktur-Entscheidungen

| Aspekt | Entscheidung | Konsequenz |
|--------|-------------|------------|
| Reverse Proxy | Caddy | HTTPS/TLS automatisch, aber kein Rate Limiting/CORS |
| HSTS | Via Caddyfile | FastAPI-Middleware nur als Fallback |
| Rate Limiting | FastAPI (primaer) | Einzige Verteidigungslinie ohne Cloudflare |
| Security Headers | Basis in Caddy, API-spezifische in FastAPI | Split-Ansatz |
| Bot-Detection / WAF | Cloudflare Free Tier (empfohlen) | Caddy kann das nicht |
