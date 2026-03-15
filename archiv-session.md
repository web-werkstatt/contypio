# Session-Archiv — Contypio CMS

---

## Session 1 (15.03.2026) — Migration + Setup

**Commits:** `a5356be` bis `ccf9737`

### Was gemacht wurde

- Gesamter CMS-Code aus `proj_irtours/cms-python/` in eigenes Repo migriert
- 308 Dateien: Backend (FastAPI), Frontend (React), Hilfe-Center, Docker
- README.md erstellt (Quick Start, Architektur, API-Doku)
- CLAUDE.md aktualisiert (neues Projekt-Layout)
- .gitignore erweitert (Python, Uploads, IDE)
- Auf Gitea gepusht: https://git.webideas24.com/webideas24/contypio
- Eigenes Deploy-Script: `infrastructure/deploy/deploy.sh`
- next-session.md mit Deploy-Workflow, Skills und Projekt-Doku

---

## Session 2 (15.03.2026) — SDK, Security, Roadmap, Issues

**Commits:** `59dc944` bis `6c8ddaf` (11 Commits, 3.500+ Zeilen)

### SDK + API
- **@contypio/client v0.2.0** — TypeScript SDK (zero deps, native fetch, ESM)
  - pages.get/list/tree/batch, collections.list/iterate, globals.get/all
  - Retry bei 429, Cursor-Pagination, AsyncIterator
- **POST /content/pages/batch** — bis zu 50 Seiten in einem Request
- **Cursor-Pagination** fuer Collections (?cursor= neben ?offset=)
- **docs/api-reference.md** — vollstaendige Delivery API Dokumentation

### Security Sprint 1 (4/4 DONE)
- S1: Security Headers (8 OWASP-Headers)
- S2: HSTS Enforcement (Defense-in-Depth, Caddy primaer)
- S3: Tenant-aware CORS (Origins pro Tenant aus DB, Default: deny all)
- S4: Filter-Allowlist (Schema-basiert, Max 10, Depth 3)

### Spezifikationen
- **docs/api-roadmap-v1.md** — Approved: 6 API-Features + 12 Security-Massnahmen
- 4 Security Sprint-Plaene (S1 DONE, S2-S4 GEPLANT)
- Roadmap umpriorisiert fuer internationalen Markt

### Infrastruktur
- Landing Page auto-generiert aus Repo-Daten (build.py + template.html)
- Deploy-Script erweitert: sync backend / frontend / landing
- Caddy Volume-Mount fuer Landing Page (/data/contypio-launch)
- **12 Gitea Issues** angelegt mit Labels (priority, type, phase)

### Entscheidungen
- Zielmarkt: **International** (nicht nur DACH)
- GraphQL: **v2 geplant** (auto-generiert aus Schema-Endpoint)
- SOC-2: **v2 Horizon** (Security Sprints als technische Grundlage)
- i18n: **Phase 1** (Marktzugangs-Blocker)
- Reverse Proxy: **Caddy** (HTTPS/TLS, HSTS; Rate Limiting + CORS in FastAPI)
- Gitea Issues als Task-Tracking Workflow

### Marktanalyse
- Contypio positioniert zwischen Developer-APIs (Strapi/Directus) und Website-Buildern (WordPress)
- USPs: Page Builder + Headless API, HTML-Importer, AI Content Scoring, Self-Hosted
- Luecken: Content i18n, SDK-Reife, Astro Starter, RBAC

---

## Session 3 (15.03.2026) — i18n, Self-Hosted Install, Deploy-Fixes

**Commits:** `4bd5013` bis `a1f9632` (3 Commits, 1.700+ Zeilen)

### Content i18n (Issue #1 — DONE)
- `translations` JSONB-Spalte auf CmsPage, CmsCollection, CmsGlobal
- `locales` + `fallback_chain` auf CmsTenant (BCP 47)
- `?locale=` Parameter auf allen Delivery-Endpoints (Pages, Collections, Globals, Batch, Tree)
- Core i18n Service: Fallback-Ketten (`de-AT → de → en`), Deep-Merge, Completeness
- `GET /content/locales` + `GET /content/pages/{slug}/locales`
- Admin API: Translation CRUD (GET/PUT/DELETE) fuer Pages, Collections, Globals
- Tenant Locale Config: `PUT/GET /api/tenants/current/locales`
- Alembic Migration `001_add_i18n_columns` deployed
- **SDK v0.3.0:** locale auf Config + allen Methoden, LocalesResource
- 100% backwards-compatible: ohne `?locale=` unveraendertes Verhalten

### Self-Hosted Install
- `install.sh`: One-command installer (`curl -fsSL https://get.contypio.com | bash`)
- `docker-compose.yml`: Production-ready (postgres + api + admin auf Port 3000)
- `docker-compose.dev.yml`: Dev-Overrides (hot-reload, Ports 8060/7460)
- `.env.example`: Alle Config-Keys dokumentiert
- Backend Dockerfile: Production (2 workers, kein --reload)
- Frontend nginx.conf: Proxy zu `api`, + /health /docs /openapi.json

### README.md
- Komplett neu geschrieben, englisch, international-ready
- Quick Start (curl + manuell), SDK Usage, API Reference, Self-Hosting Guide

### Deploy-Fixes
- Middleware-Reihenfolge: CORS-Wrapping ans Ende von main.py (war latenter Bug)
- FastAPI Parameter: Kein SQLAlchemy-Model als Endpoint-Parameter
- Production DB: Fehlende cors_origins/cors_max_age Spalten ergaenzt

### Entscheidungen
- Self-Hosted Install: Docker Compose Pattern (wie Coolify/Plausible), kein NPX (kommt spaeter)
- Port 3000: Single-Port Setup, nginx als Reverse Proxy intern
- install.sh statt install.py: Bash = Industriestandard fuer curl|bash
