# Next Session - Contypio CMS

**Stand:** 15.03.2026 (nach Session 2)
**Letzter Commit:** `975d86b` docs: Roadmap umpriorisiert fuer internationalen Markt
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/ (auto-generiert)
**Issues:** https://git.webideas24.com/webideas24/contypio/issues (12 offen)

---

## Was in Session 2 gemacht wurde

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
- **docs/api-roadmap-v1.md** — Approved Spec: 6 API-Features + 12 Security-Massnahmen
- 4 Security Sprint-Plaene (S1 DONE, S2-S4 GEPLANT)
- Roadmap umpriorisiert fuer internationalen Markt

### Infrastruktur
- Landing Page auto-generiert aus Repo-Daten (build.py + template.html)
- Deploy-Script: sync backend / frontend / landing
- Caddy Volume-Mount fuer Landing Page (/data/contypio-launch)
- **12 Gitea Issues** angelegt mit Labels (priority, type, phase)

### Entscheidungen
- Zielmarkt: **International** (nicht nur DACH)
- GraphQL: **v2 geplant** (auto-generiert aus Schema-Endpoint)
- SOC-2: **v2 Horizon** (Security Sprints als technische Grundlage)
- i18n: **Phase 1** (Marktzugangs-Blocker)
- Reverse Proxy: **Caddy** (HTTPS/TLS, HSTS; Rate Limiting + CORS in FastAPI)

---

## Naechste Session — Prioritaeten

### 1. Content i18n (Issue #1, Phase 1) — CRITICAL
- ?locale= Parameter auf allen Delivery-Endpoints
- Fallback-Ketten (de-AT → de → en)
- DB-Schema-Aenderungen (nested JSON in data-Spalte)
- SDK v0.3 mit locale-Support

### 2. Security Sprint 2 (Issue #2, Phase 2) — CRITICAL
- S5: API-Key-Hashing (SHA-256)
- S6: Key-Rotation mit Grace Period
- S7: Tiered Rate Limits (public/live/build)

### 3. Batch-Format-Umbau (Issue #5, Phase 2) — HIGH
- Pages-Batch: Map → Array + requested/found/missing
- Collections-Batch: POST /content/collections/{key}/batch (neu)

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
```

---

## Gitea Issues (12 offen)

| # | Issue | Priority | Phase |
|---|-------|----------|-------|
| #1 | Content i18n | critical | Phase 1 |
| #2 | Security Sprint 2 | critical | Phase 2 |
| #3 | Security Sprint 3 | high | Phase 2 |
| #4 | Security Sprint 4 | high | Phase 2 |
| #5 | Batch-Format-Umbau | high | Phase 2 |
| #6 | Schema-Endpoint | medium | Phase 3 |
| #7 | Depth Control | medium | Phase 3 |
| #8 | API-Versionierung | medium | Phase 3 |
| #9 | Englische Docs | high | Phase 3 |
| #10 | Astro Starter | medium | — |
| #11 | GraphQL-Layer | medium | v2 |
| #12 | SOC-2 Vorbereitung | medium | v2 |

---

## Verbindliche Spezifikationen

- `docs/api-roadmap-v1.md` — API + Security Roadmap (Approved)
- `docs/api-reference.md` — Delivery API Dokumentation
- Gitea Issues als Task-Tracking

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI Entry Point + Middleware-Stack |
| `backend/app/middleware/` | Security Headers, HSTS, Tenant CORS |
| `backend/app/validators/` | Filter-Allowlist |
| `packages/contypio-client/` | TypeScript SDK v0.2.0 |
| `docs/api-roadmap-v1.md` | Verbindliche Spec |
| `infrastructure/landing/build.py` | Landing Page Generator |
| `infrastructure/deploy/deploy.sh` | Deploy Script |
