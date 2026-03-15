# Next Session - Contypio CMS

**Stand:** 15.03.2026 (Session 2)
**Letzter Commit:** `e8aaf95` feat: Landing Page aktualisiert + deploy sync landing
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/

---

## Was in Session 2 gemacht wurde

### SDK + API
- **@contypio/client v0.2.0** — TypeScript SDK (zero deps, native fetch, ESM)
  - `pages.get()`, `pages.list()`, `pages.tree()`, `pages.batch()`
  - `collections.list()`, `collections.iterate()` (AsyncIterator)
  - `globals.get()`, `globals.all()`
  - Retry bei 429 mit Exponential Backoff
- **POST /content/pages/batch** — bis zu 50 Seiten in einem Request
- **Cursor-Pagination** fuer Collections (?cursor= neben ?offset=)
- **docs/api-reference.md** — vollstaendige Delivery API Dokumentation
- **docs/api-roadmap-v1.md** — verbindliche Spec (6 API-Features + 12 Security-Massnahmen)

### Security Sprint 1 (teilweise)
- **S1: Security Headers** — 8 OWASP-Headers auf jeder Response
- **S2: HSTS Enforcement** — Defense-in-Depth Fallback (Caddy primaer)
- **S4: Filter-Allowlist** — Bracket-Filter nur auf Schema-Felder
- **S3: Tenant CORS** — OFFEN (naechster Task)

### Landing Page
- headless-cms.webideas24.com aktualisiert (92%, SDK, Security, Roadmap)
- Deploy-Script erweitert: `sync landing`

### Sprint-Plaene
- SPRINT_SECURITY_S1.md bis S4.md angelegt
- SPRINT_API_EVOLUTION.md (Batch + Cursor + SDK v0.2)

---

## Deployment

### Production (IR-Tours Referenz-Instanz)

**Server:** 176.9.1.186 (pve3) -> Docker-VM 10.10.10.100 (SSH: `irtours-docker`)

```bash
./infrastructure/deploy/deploy.sh sync backend     # Python Code (~5s)
./infrastructure/deploy/deploy.sh sync frontend    # React Build (~30s)
./infrastructure/deploy/deploy.sh sync all         # Beides
./infrastructure/deploy/deploy.sh status           # Container-Status
./infrastructure/deploy/deploy.sh logs backend     # Logs
./infrastructure/deploy/deploy.sh health           # Health-Check
```

### Landing Page (SaaS Server)

**Server:** 168.119.35.184 (hetzner-saas) -> Docker-VM 10.10.10.100 (SSH: `docker-vm`)

```bash
./infrastructure/deploy/deploy.sh sync landing     # HTML rsync (~3s)
```

### Lokal (Docker Compose)

```bash
cd /mnt/projects/proj_contypio
cp backend/.env.example backend/.env
docker compose up

# API:       http://localhost:8060
# Admin UI:  http://localhost:8061
# DB:        localhost:7460
```

---

## Offene Aufgaben

### Prioritaet 1: Security Sprint 1 abschliessen
- [x] S1: Security Response Headers
- [x] S2: HTTPS/HSTS Enforcement (Defense-in-Depth)
- [x] S4: Filter-Field-Allowlist
- [ ] **S3: CORS pro Tenant** — Braucht DB-Feld `cors_origins` am Tenant-Model

### Prioritaet 1: Batch-Endpoint Format-Umbau
- [ ] Pages-Batch: Map-Response -> Array + `requested/found/missing` (laut Spec)
- [ ] Collections-Batch: `POST /content/collections/{key}/batch` (neu)
- [ ] SDK anpassen

### Prioritaet 2: Security Sprints 2-4
- [ ] S2: Key-Hashing, Key-Rotation, Tiered Rate Limits
- [ ] S3: BOPLA-Audit, Webhook Replay, Audit-Log, Search Sanitization
- [ ] S4: Tenant-Isolation, Penetration-Tests, Security-Doku

### Prioritaet 2: API-Roadmap Features
- [ ] Relation Depth Control (?depth=0..5)
- [ ] Schema-Endpoint (GET /content/schema)
- [ ] API-Versionierung (/api/v1/)
- [ ] Content Localization (i18n) — groesstes Feature

### Prioritaet 3: IR-Tours Referenzen bereinigen (Rebranding)
- [ ] Frontend: 4 Dateien mit `ir-tours` Referenzen
- [ ] Backend: `travel_api.py` auslagern
- [ ] Hilfe-Center: 10 Dateien mit `ir-tours` Referenzen

### Prioritaet 3: Astro Starter + Demo Seed
- [ ] starters/astro/ — SSG-Beispiel mit SDK
- [ ] Demo-Seed-Daten (neutrale Beispielseiten)

---

## Sprint-Status Uebersicht

| Sprint | Name | Status |
|--------|------|--------|
| L1-L5b | Backend, UI, Editor, Travel Blocks | DONE |
| L6 | Media Library | DONE |
| L7+L7b | Collections, Globals, Field Registry | DONE |
| L9 | Section Presets + Daten-Blocks | DONE |
| L10 | Live Preview | DONE |
| L11 | White-Label + Billing + Editions | DONE |
| L14 | PageEditor 3-Spalten + Versioning | DONE |
| VE | Visual Editing (Phase 1-3) | DONE |
| L16-L19 | Preview CSS, Webhooks, Delivery API, Migration | DONE |
| L22-L26 | Module-Manager, Importer, Block-Typen, Relations | DONE |
| L28 | API-Keys, AI-Fields, Schema-as-Code | DONE |
| G1+G2 | i18n Frontend + Backend | DONE |
| **L20a** | **API Standardisierung** | **DONE** |
| **API-Evo** | **Batch + Cursor + SDK v0.2** | **DONE** |
| **Sec-S1** | **Security Headers, HSTS, Filter** | **3/4 DONE** |
| **L20** | **Go-Live ir-tours.de** | **READY** |
| Sec-S2 | Key-Management + Rate Limits | GEPLANT |
| Sec-S3 | Response-Security + Webhooks | GEPLANT |
| Sec-S4 | Tenant-Isolation + Audit | GEPLANT |
| G3-lite | Minimaler Installer | PLAN |
| M1 | Landing Page + Docs | PLAN |
| B1 | Block-Editor Core (USP!) | PLAN (Phase A) |
| G4 | RBAC Permission-Based | PLAN (Phase A) |

---

## Verbindliche Spezifikationen

- `docs/api-roadmap-v1.md` — API-Erweiterungen + Security Hardening (Approved)
- `docs/api-reference.md` — Delivery API Dokumentation
- Alle API-/SDK-Aenderungen orientieren sich an der Roadmap.

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI App Entry Point |
| `backend/app/delivery/` | Delivery API (oeffentlich) |
| `backend/app/middleware/` | Security Headers, HSTS, (CORS kommt) |
| `backend/app/validators/` | Filter-Allowlist |
| `backend/app/core/config.py` | Umgebungsvariablen |
| `packages/contypio-client/` | TypeScript SDK v0.2.0 |
| `docs/api-roadmap-v1.md` | Verbindliche API + Security Spec |
| `docs/api-reference.md` | Delivery API Referenz |
| `infrastructure/deploy/deploy.sh` | Deploy Script (backend, frontend, landing) |
| `infrastructure/landing/index.html` | Launch Tracker Page |
| `sessions/sprints/SPRINT_SECURITY_S*.md` | Security Sprint-Plaene |
