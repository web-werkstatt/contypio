# Next Session - Contypio CMS

**Stand:** 15.03.2026 (nach Session 3)
**Letzter Commit:** `a1f9632` feat: Self-Hosted Install
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/ (auto-generiert)
**Issues:** https://git.webideas24.com/webideas24/contypio/issues (11 offen, 1 closed)

---

## Was in Session 3 gemacht wurde

### Content i18n (Issue #1 — DONE, deployed)
- **Field-Level i18n** mit `translations` JSONB-Spalte auf allen Content-Models
- `?locale=` auf allen Delivery-Endpoints (Pages, Collections, Globals, Batch, Tree)
- Fallback-Ketten: `de-AT → de → en` (BCP 47, konfigurierbar pro Tenant)
- `GET /content/locales` + `GET /content/pages/{slug}/locales` (Completeness Scores)
- Admin API: Translation CRUD + Tenant Locale Config
- **SDK v0.3.0:** locale auf Config + allen Methoden, LocalesResource
- Alembic Migration deployed auf Production

### Self-Hosted Install
- **`install.sh`** — One-command installer (`curl | bash`)
- **`docker-compose.yml`** — Production auf Port 3000 (single port)
- **`docker-compose.dev.yml`** — Dev-Overrides (hot-reload, Ports 8060/7460)
- **`.env.example`** — Alle Config-Keys dokumentiert
- **`README.md`** — Komplett neu, englisch, international-ready

### Deploy-Fixes
- Middleware-Reihenfolge (CORS-Wrapping am Ende von main.py)
- FastAPI Parameter-Kompatibilitaet (kein SQLAlchemy-Model als Endpoint-Param)
- Fehlende DB-Spalten auf Production ergaenzt

---

## Naechste Session — Prioritaeten

### 1. Security Sprint 2 (Issue #2, Phase 2) — CRITICAL
- S5: API-Key-Hashing (SHA-256, bestehende Keys automatisch migrieren)
- S6: Key-Rotation mit Grace Period (alter + neuer Key parallel gueltig)
- S7: Tiered Rate Limits (public: 100/min, live: 500/min, build: 2000/min)
- Spec: `docs/api-roadmap-v1.md` Kapitel S5-S7
- Sprint-Plan: `sessions/sprints/SPRINT_SECURITY_S2.md`

### 2. Batch-Format-Umbau (Issue #5, Phase 2) — HIGH
- Pages-Batch: Map → Array + requested/found/missing (Breaking Change mit Migrationspfad)
- Collections-Batch: `POST /content/collections/{key}/batch` (neu)
- SDK v0.3.x: Batch-Response-Types anpassen

### 3. Security Sprint 3 (Issue #3, Phase 2) — HIGH
- S8: Webhook Replay-Schutz (HMAC Signatur v2)
- S9: BOPLA-Audit (Response Filtering)
- S10: Request-Logging / Audit-Trail
- S11: Search-Input-Sanitization
- Sprint-Plan: `sessions/sprints/SPRINT_SECURITY_S3.md`

---

## Deployment

```bash
# Production (IR-Tours)
./infrastructure/deploy/deploy.sh sync backend     # Python Code (~5s)
./infrastructure/deploy/deploy.sh sync frontend    # React Build (~30s)
./infrastructure/deploy/deploy.sh sync all         # Beides

# Landing Page (auto-build + deploy)
./infrastructure/deploy/deploy.sh sync landing     # Build + rsync (~3s)

# Status
./infrastructure/deploy/deploy.sh status
./infrastructure/deploy/deploy.sh health

# Self-Hosted (lokale Entwicklung)
docker compose up -d                               # Port 3000
docker compose -f docker-compose.yml -f docker-compose.dev.yml up  # Dev-Modus
```

---

## Gitea Issues

| # | Issue | Priority | Phase | Status |
|---|-------|----------|-------|--------|
| ~~#1~~ | ~~Content i18n~~ | ~~critical~~ | ~~Phase 1~~ | **DONE** |
| #2 | Security Sprint 2 | critical | Phase 2 | TODO |
| #3 | Security Sprint 3 | high | Phase 2 | TODO |
| #4 | Security Sprint 4 | high | Phase 2 | TODO |
| #5 | Batch-Format-Umbau | high | Phase 2 | TODO |
| #6 | Schema-Endpoint | medium | Phase 3 | TODO |
| #7 | Depth Control | medium | Phase 3 | TODO |
| #8 | API-Versionierung | medium | Phase 3 | TODO |
| #9 | Englische Docs | high | Phase 3 | teilweise (README done) |
| #10 | Astro Starter | medium | — | TODO |
| #11 | GraphQL-Layer | medium | v2 | TODO |
| #12 | SOC-2 Vorbereitung | medium | v2 | TODO |

---

## Verbindliche Spezifikationen

- `docs/api-roadmap-v1.md` — API + Security Roadmap (Approved)
- `docs/api-reference.md` — Delivery API Dokumentation
- Gitea Issues als Task-Tracking

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI Entry Point + Middleware-Stack |
| `backend/app/core/content_i18n.py` | i18n Service (Fallback, Merge, Completeness) |
| `backend/app/delivery/` | Delivery Endpoints (Pages, Collections, Globals, Locales) |
| `backend/app/middleware/` | Security Headers, HSTS, Tenant CORS |
| `backend/app/services/translation_service.py` | Translation CRUD |
| `packages/contypio-client/` | TypeScript SDK v0.3.0 |
| `docs/api-roadmap-v1.md` | Verbindliche Spec |
| `docker-compose.yml` | Self-Hosted Setup (Port 3000) |
| `install.sh` | One-command Installer |
| `infrastructure/deploy/deploy.sh` | Production Deploy Script |
