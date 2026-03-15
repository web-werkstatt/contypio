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
