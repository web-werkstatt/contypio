# Next Session - Contypio CMS

**Stand:** 15.03.2026 (nach Session 5)
**Letzter Commit:** `b5e864a` feat: Selektiver Section-Import + Apply-Endpoint
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/ (auto-generiert)
**Issues:** https://git.webideas24.com/webideas24/contypio/issues

---

## Was in Session 5 gemacht wurde

### Schema-Endpoint (Issue #6 — DONE, deployed)
- `GET /content/schema` — Alle Collection-Schemas (fuer SDK Codegen)
- `GET /content/schema/{key}` — Einzelnes Schema
- Public (kein Auth), Cache: 300s + 600s stale-while-revalidate
- Neue Datei: `backend/app/delivery/schema.py`

### Depth Control (Issue #7 — DONE, deployed)
- `?depth=0..5` Parameter auf allen Delivery-Endpoints
- Default 2 (bisheriges Verhalten, non-breaking)
- depth=0: keine Media/Relation-Resolution (IDs only)
- Pages + Collections + Batch-Endpoints

### HTML-Importer Rewrite
- Multi-Column Layouts erkannt (2-4 Spalten aus Tailwind/CSS Grid)
- Tailwind responsive Prefixes (`sm:grid-cols-2` etc.)
- Gallery-Items in Wrappern (team-gallery-item) korrekt als Bilder
- CTA-Buttons in div-Wrappern erkannt
- HTML-Kommentare + Lightboxes + aria-hidden entfernt (Noise-Removal)
- Section-Erkennung: keine false positives bei "section" CSS-Substring

### Selektiver Section-Import + Apply-Endpoint
- `POST /api/website-import/apply` — Sections auf Page anwenden
  - `mode: "all"` — Alle Sections ersetzen
  - `mode: "replace"` + `replace_indices` — Nur bestimmte Sections
  - `mode: "append"` — Sections anhaengen
- Frontend: StepPreview mit Section-Checkboxen zum An-/Abwaehlen
- Import nutzt neuen /apply Endpoint statt PUT /api/pages

### README aktualisiert
- Security-Tabelle (S1-S12), Batch-API, Single-Container-Architektur

### Astro Frontend Update (IR-Tours Container)
- Node.js 20 → **22.22.0**
- Astro 5.17.2 → **6.0.4**
- Tailwind CSS 3.4 → **4.2.1** (Config via CSS @theme statt JS)
- @astrojs/tailwind → **@tailwindcss/vite** (natives Vite-Plugin)
- tailwind.config.mjs entfaellt — alles in global.css @theme
- Build: 72 Seiten, alle 8 Validierungschecks gruen

### Fixes
- Admin-Passwort Reset (admin@ir-tours.de)
- Homepage Section 1: Markdown → HTML + korrektes 2-Spalten Layout

---

## Naechste Session — Prioritaeten

### 1. API-Versionierung (Issue #8, Phase 3) — MEDIUM
- `/api/v1/content/...` Prefix-Routing
- Phase 1: Beide Pfade aktiv
- X-API-Version Header

### 2. Englische Docs (Issue #9, Phase 3) — HIGH
- API Reference done, README done
- Hilfe-Center komplett deutsch → Englisch uebersetzen (21 Dateien)

### 3. Frontend-Luecken schliessen — MEDIUM
- Audit-Log Viewer (Backend vorhanden, keine UI)
- API-Key Rotation UI (Backend-Endpoint da, kein Button)
- Tenant Locale Config UI

### 4. Test-Abdeckung nachholen — MEDIUM
- Security Middleware (S1-S3) — keine Tests
- API-Key Hashing/Rotation (S5/S6) — keine Tests
- Batch-Endpoints — keine Tests
- Webhook-Signatur (S8) — keine Tests

### 5. Astro Starter (Issue #10) — MEDIUM
- Referenz-Frontend mit @contypio/client
- 6 Block-Komponenten (RichText, Image, Cards, CTA, FAQ, Gallery)
- SSG-Modus, Tailwind

---

## Empfohlene Reihenfolge

```
Session 6:  API-Versionierung + Englische Docs
            → Phase 3 abschliessen

Session 7:  Frontend-Luecken + Tests
            → Audit-Log UI, Key-Rotation UI, Test-Coverage

Session 8:  Astro Starter + Demo Seed
            → GitHub-Launch-ready

Session N:  Setup-Wizard (#13) — Web-GUI fuer Erstinstallation
            → Alternative zu .env-Konfiguration fuer Nicht-Techniker
            → Erst wenn API + Datenmodell stabil sind

Session N:  Webstudio-PoC (#14) — Design-Tool Integration
            → ir-tours Hero + Card-Liste in Webstudio designen
            → Minimalen css-to-tailwind Converter-Prototyp bauen (eine Section)
            → Siehe docs/webstudio-integration.md
```

---

## Deployment

```bash
# Production (IR-Tours)
./infrastructure/deploy/deploy.sh sync backend     # Python Code (~5s)
./infrastructure/deploy/deploy.sh sync frontend    # React Build (~30s)
./infrastructure/deploy/deploy.sh sync all         # Beides

# Migrations (nach Model-Aenderungen)
scp backend/migrations/versions/XXX.py irtours-docker:/tmp/
ssh irtours-docker "docker cp /tmp/XXX.py irtours-cms:/app/migrations/versions/"
ssh irtours-docker "docker exec -w /app -e PYTHONPATH=/app irtours-cms alembic upgrade head"

# Self-Hosted
docker compose up -d                               # Port 3000
docker compose -f docker-compose.yml -f docker-compose.dev.yml up  # Dev

# Status
./infrastructure/deploy/deploy.sh health
```

---

## Gitea Issues

| # | Issue | Priority | Phase | Status |
|---|-------|----------|-------|--------|
| ~~#1~~ | ~~Content i18n~~ | ~~critical~~ | ~~Phase 1~~ | **DONE** |
| ~~#2~~ | ~~Security Sprint 2~~ | ~~critical~~ | ~~Phase 2~~ | **DONE** |
| ~~#3~~ | ~~Security Sprint 3~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#4~~ | ~~Security Sprint 4~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#5~~ | ~~Batch-Format-Umbau~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#6~~ | ~~Schema-Endpoint~~ | ~~medium~~ | ~~Phase 3~~ | **DONE** |
| ~~#7~~ | ~~Depth Control~~ | ~~medium~~ | ~~Phase 3~~ | **DONE** |
| #8 | API-Versionierung | medium | Phase 3 | TODO |
| #9 | Englische Docs | high | Phase 3 | teilweise |
| #10 | Astro Starter | medium | — | TODO |
| #11 | GraphQL-Layer | medium | v2 | TODO |
| #12 | SOC-2 Vorbereitung | medium | v2 | TODO |
| #13 | Setup-Wizard (Web GUI) | medium | Launch | TODO |
| #14 | Webstudio-PoC (Design-Tool) | medium | Launch | TODO |

**Erledigt:** 7 von 12 Issues (+ Self-Hosted Install, README, Importer-Rewrite, Astro 6 Upgrade)

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI Entry Point + Middleware-Stack |
| `backend/app/delivery/schema.py` | Schema-Endpoint (Issue #6) |
| `backend/app/delivery/query_params.py` | DepthParams (Issue #7) |
| `backend/app/api/website_import.py` | Scrape + Apply Endpoints |
| `backend/app/importers/html_to_nodes.py` | HTML → Node-Baum (Multi-Column) |
| `backend/app/importers/nodes_to_blocks.py` | Node-Baum → CMS Sections |
| `backend/app/core/rate_limit.py` | Tiered Rate Limits (S7) |
| `backend/app/auth/api_key.py` | Key-Hashing + Rotation (S5/S6) |
| `backend/app/delivery/` | Delivery Endpoints (Pages, Collections, Globals, Locales, Schema) |
| `backend/app/middleware/` | Security Headers, HSTS, Tenant CORS, Audit Log |
| `packages/contypio-client/` | TypeScript SDK v0.3.0 |
| `docker-compose.yml` | Self-Hosted Setup (Port 3000) |
| `docs/api-roadmap-v1.md` | Verbindliche Spec |

## Astro Frontend (IR-Tours Container)

| Komponente | Version |
|---|---|
| Node.js | 22.22.0 |
| Astro | 6.0.4 |
| Tailwind CSS | 4.2.1 (@tailwindcss/vite) |
| React | 18.3.x (@astrojs/react) |
| Container | irtours-astro-builder |
