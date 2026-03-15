# Next Session - Contypio CMS

**Stand:** 15.03.2026 (nach Session 3)
**Letzter Commit:** `9fc7a47` feat: Batch-Format-Umbau + Security Sprint 2
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/ (auto-generiert)
**Issues:** https://git.webideas24.com/webideas24/contypio/issues

---

## Was in Session 3 gemacht wurde

### Content i18n (Issue #1 — DONE, deployed)
- `translations` JSONB auf CmsPage, CmsCollection, CmsGlobal
- `?locale=` auf allen Delivery-Endpoints + Fallback-Ketten (BCP 47)
- GET /content/locales + GET /content/pages/{slug}/locales
- Admin Translation CRUD + Tenant Locale Config
- SDK v0.3.0: locale Support + LocalesResource
- Alembic Migration 001 deployed

### Batch-Format-Umbau (Issue #5 — DONE, deployed)
- Pages Batch: Map → Array (items[], requested, found, missing)
- POST /content/collections/{key}/batch (IDs oder Slugs, max 100)
- SDK: BatchCollectionResponse + collections.batch()

### Security Sprint 2 (Issue #2 — DONE, deployed)
- S6: Key-Rotation mit Grace Period (POST /api/api-keys/{id}/rotate)
- S7: Tiered Rate Limits (public: 100/min, live: 500/min, build: 2000/min)
- X-RateLimit-Tier Header, Alembic Migration 002 deployed

### Self-Hosted Install
- install.sh (curl|bash), docker-compose.yml (Port 3000), .env.example
- docker-compose.dev.yml (Dev-Overrides)
- README.md komplett neu (englisch, international)

### Deploy-Fixes
- Middleware-Reihenfolge (CORS-Wrapping am Ende)
- FastAPI Parameter-Kompatibilitaet
- Fehlende DB-Spalten auf Production

---

## Naechste Session — Prioritaeten

### 1. Security Sprint 3 (Issue #3, Phase 2) — HIGH
- S8: Webhook Replay-Schutz (HMAC Signatur v2, Timestamp-Validierung)
- S9: BOPLA-Audit (Response Filtering — keine internen Felder leaken)
- S10: Request-Logging / Audit-Trail (90d Retention, IP-Anonymisierung nach 7d)
- S11: Search-Input-Sanitization
- Sprint-Plan: `sessions/sprints/SPRINT_SECURITY_S3.md`

### 2. Security Sprint 4 (Issue #4, Phase 2) — HIGH
- S12: Tenant-Isolation-Audit (Cross-Tenant-Guard)
- Sprint-Plan: `sessions/sprints/SPRINT_SECURITY_S4.md`

### 3. Schema-Endpoint (Issue #6, Phase 3) — MEDIUM
- GET /content/schema/{collection_key} — Collection-Schema oeffentlich
- GET /content/schema — Alle Schemas (fuer SDK Codegen)
- Cache-Control: public, max-age=300

### 4. Depth Control (Issue #7, Phase 3) — MEDIUM
- ?depth=0..5 Parameter auf Delivery-Endpoints
- Default 2 (aktuelles Verhalten)

### 5. Englische Docs (Issue #9, Phase 3) — HIGH
- API Reference, Hilfe-Center, Landing Page komplett Englisch
- README.md bereits done

### 6. Astro Starter (Issue #10) — MEDIUM
- Referenz-Frontend mit @contypio/client
- 6 Block-Komponenten (RichText, Image, Cards, CTA, FAQ, Gallery)
- SSG-Modus, Tailwind

---

## Empfohlene Reihenfolge

```
Session 4:  Security Sprint 3 + 4 (S8-S12)
            → Schliesst Security-Grundlage ab, SOC-2-ready

Session 5:  Schema-Endpoint + Depth Control + Englische Docs
            → Phase 3 Features, Developer Experience

Session 6:  Astro Starter + Demo Seed + API-Versionierung
            → GitHub-Launch-ready
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
| #3 | Security Sprint 3 | high | Phase 2 | TODO |
| #4 | Security Sprint 4 | high | Phase 2 | TODO |
| ~~#5~~ | ~~Batch-Format-Umbau~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| #6 | Schema-Endpoint | medium | Phase 3 | TODO |
| #7 | Depth Control | medium | Phase 3 | TODO |
| #8 | API-Versionierung | medium | Phase 3 | TODO |
| #9 | Englische Docs | high | Phase 3 | teilweise |
| #10 | Astro Starter | medium | — | TODO |
| #11 | GraphQL-Layer | medium | v2 | TODO |
| #12 | SOC-2 Vorbereitung | medium | v2 | TODO |

**Erledigt:** 3 von 12 Issues (+ Self-Hosted Install, README)

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI Entry Point + Middleware-Stack |
| `backend/app/core/content_i18n.py` | i18n Service (Fallback, Merge, Completeness) |
| `backend/app/core/rate_limit.py` | Tiered Rate Limits (S7) |
| `backend/app/auth/api_key.py` | Key-Hashing + Rotation (S5/S6) |
| `backend/app/delivery/` | Delivery Endpoints (Pages, Collections, Globals, Locales) |
| `backend/app/middleware/` | Security Headers, HSTS, Tenant CORS |
| `packages/contypio-client/` | TypeScript SDK v0.3.0 |
| `docker-compose.yml` | Self-Hosted Setup (Port 3000) |
| `install.sh` | One-command Installer |
| `docs/api-roadmap-v1.md` | Verbindliche Spec |
