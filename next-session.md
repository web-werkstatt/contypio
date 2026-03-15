# Next Session - Contypio CMS

**Stand:** 15.03.2026 (Session 1 nach Migration)
**Letzter Commit:** `705f7bc` feat: Contypio CMS v0.1.0 — vollstaendiger Produkt-Code
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API

---

## Was gemacht wurde (Migration)

- Gesamter CMS-Code aus `proj_irtours/cms-python/` in eigenes Repo migriert
- 308 Dateien: Backend (FastAPI), Frontend (React), Hilfe-Center, Docker
- README.md erstellt (Quick Start, Architektur, API-Doku)
- CLAUDE.md aktualisiert (neues Projekt-Layout)
- .gitignore erweitert (Python, Uploads, IDE)
- Auf Gitea gepusht

---

## Deployment

### Production (IR-Tours Referenz-Instanz)

**Server:** 176.9.1.186 (pve3) -> Docker-VM 10.10.10.100 (SSH: `irtours-docker`)
**Script:** `./infrastructure/deploy/deploy.sh`

```bash
# Backend deployen (Python Code rsync + Container Restart, ~5s)
./infrastructure/deploy/deploy.sh sync backend

# Frontend deployen (npm build + dist rsync, ~30s)
./infrastructure/deploy/deploy.sh sync frontend

# Beides
./infrastructure/deploy/deploy.sh sync all

# Status + Logs
./infrastructure/deploy/deploy.sh status
./infrastructure/deploy/deploy.sh logs backend
./infrastructure/deploy/deploy.sh logs frontend
./infrastructure/deploy/deploy.sh health
```

**Was passiert dabei:**
- `sync backend`: rsync `backend/app/` -> `irtours-docker:/opt/ir-tours/cms-app/`, restart `irtours-cms`
- `sync frontend`: `npm run build`, rsync `frontend/dist/` -> `irtours-docker:/opt/ir-tours/cms-admin-dist/`, restart `irtours-cms-admin`

**Health-Check:** https://cms.ir-tours.de/health

### Lokal (Docker Compose)

```bash
cd /mnt/projects/proj_contypio
cp backend/.env.example backend/.env
docker compose up

# API:       http://localhost:8060
# Admin UI:  http://localhost:8061
# DB:        localhost:7460
# API Docs:  http://localhost:8060/docs
```

---

## Arbeitsumgebung

| Service | Port (lokal) | Port (Production) | Tech |
|---------|------|------|------|
| Backend API | 8060 | via cms.ir-tours.de | FastAPI 0.115+ |
| Admin Frontend | 8061 | via cms.ir-tours.de | React 19 + shadcn/ui |
| PostgreSQL | 7460 | 7433 (shared) | PostgreSQL 17 |
| Hilfe-Center | - | hilfe.ir-tours.de | Flask + Markdown |

---

## Projekt-Struktur

```
contypio/
  backend/              FastAPI Backend (Python)
    app/
      api/              22 Admin-API Endpoints
      auth/             JWT + API Key Auth
      core/             Config, DB, i18n, Rate Limit, Error Handler
      delivery/         10 Delivery API Endpoints (oeffentlich)
      importers/        Website-to-CMS Importer
      models/           13 SQLAlchemy Models
      schemas/          13 Pydantic Schemas
      services/         24 Business Services
    tests/              Tests
    Dockerfile          Dev Container
    Dockerfile.proxmox  Production Container
    requirements.txt    Python Dependencies
  frontend/             React Admin UI (TypeScript)
    src/
      pages/            25+ Seiten-Komponenten
      components/       80+ UI Components (35 Block-Editoren)
      hooks/            Custom Hooks
      lib/              API Client, i18n, Presets
      types/            TypeScript Interfaces
      locales/          i18n (en + de)
    package.json
    Dockerfile          Multi-Stage Build (Node -> Nginx)
  hilfe-center/         Self-Hosted Help Center
    content/            23 Markdown Topics
    app.py              Flask App
  packages/
    contypio-client/    TypeScript SDK (noch leer)
  starters/
    astro/              Astro Starter Template (noch leer)
  infrastructure/
    deploy/
      deploy.sh         Production Deploy Script
  docker-compose.yml    Lokale Entwicklung
```

---

## Workflow

### Code aendern + deployen

1. Code in `proj_contypio` aendern
2. Testen:
   ```bash
   cd backend && python3 -m pytest tests/ -v
   cd frontend && npm run build
   ```
3. Deployen:
   ```bash
   ./infrastructure/deploy/deploy.sh sync backend     # Backend
   ./infrastructure/deploy/deploy.sh sync frontend    # Frontend
   ./infrastructure/deploy/deploy.sh sync all         # Beides
   ```
4. Commit + Push:
   ```bash
   git add <files>
   git commit -m "feat/fix/docs: Beschreibung"
   git push origin main
   ```

---

## Code Standards

### Python (Backend)
- Type Hints ueberall
- Pydantic fuer Validation
- SQLAlchemy ORM (KEINE Raw SQL)
- Max 500 Zeilen/Datei, 50 Zeilen/Funktion
- Async/await fuer I/O

### TypeScript/React (Frontend)
- Functional Components + Hooks
- Strikte Types, KEIN `any`
- React Query fuer Server State
- Max 300 Zeilen/Component
- shadcn/ui Komponenten bevorzugen
- UI-Texte mit korrekten Umlauten (ae->ae, oe->oe, ue->ue, ss->ss)

### Commits
- Prefixes: feat, fix, refactor, docs, test, chore
- Deutsch oder Englisch (konsistent pro Commit)

---

## Skills

| Skill | Zweck |
|-------|-------|
| `/sprint-planner` | Sprint-Plan als .md erstellen (nach Plan-Modus) |
| `/session-end` | next-session.md aktualisieren, commit+push |
| `/git-commit-push` | Git Commit + Push auf Gitea |
| `/server-admin` | Proxmox/Docker Admin, Container-Management |
| `/docker-health-check` | Container-Diagnose wenn Services down |
| `/hilfe-topic` | Hilfe-Center Topic erstellen (Markdown) |
| `/changelog` | Aenderungen dokumentieren |

### Deploy-Befehle (Kurzform)
```bash
./infrastructure/deploy/deploy.sh sync backend     # Python Code
./infrastructure/deploy/deploy.sh sync frontend    # React Build
./infrastructure/deploy/deploy.sh sync all         # Beides
./infrastructure/deploy/deploy.sh status           # Container-Status
./infrastructure/deploy/deploy.sh logs backend     # Logs
./infrastructure/deploy/deploy.sh health           # Health-Check
```

---

## Offene Aufgaben

### ~~Prioritaet 1: Deploy-Workflow~~ DONE
- [x] Eigenes Deploy-Script: `infrastructure/deploy/deploy.sh`
- [x] Unabhaengig von proj_irtours

### Prioritaet 1: IR-Tours Referenzen bereinigen (Rebranding)
- [ ] Frontend: 4 Dateien mit `ir-tours` Referenzen (Beispiel-URLs)
- [ ] Backend: `travel_api.py` (IR-Tours spezifisch — als Plugin/Integration auslagern)
- [ ] Hilfe-Center: 10 Dateien mit `ir-tours` Referenzen (Beispiel-URLs in Docs)
- [ ] Plan: `PLAN_REBRANDING_DOMAIN.md` existiert bereits

### Prioritaet 2: Sprint L20 — Go-Live ir-tours.de auf CMS
- Sprint-Plan: `proj_irtours/sessions/sprints/cms-python/SPRINT_L20_GOLIVE.md` (noch erstellen)
- Voraussetzung: L20a (API Standardisierung) ist DONE

### Prioritaet 3: SDK + Starter (GitHub-Launch)
- Sprint-Plan: `sessions/sprints/SPRINT_CONTYPIO_GITHUB_LAUNCH.md`
- TypeScript SDK (`packages/contypio-client/`)
- Astro Starter (`starters/astro/`)

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
| **L20** | **Go-Live ir-tours.de** | **READY** |
| G3-lite | Minimaler Installer | PLAN |
| M1 | Landing Page + Docs | PLAN |
| B1 | Block-Editor Core (USP!) | PLAN (Phase A) |
| G4 | RBAC Permission-Based | PLAN (Phase A) |

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|-------------|
| `backend/app/main.py` | FastAPI App Entry Point |
| `backend/app/delivery/` | Delivery API (oeffentlich) |
| `backend/app/core/config.py` | Umgebungsvariablen |
| `backend/app/core/errors.py` | Bilinguale Error-Codes |
| `backend/app/core/error_handler.py` | RFC 7807 Handler |
| `backend/app/core/rate_limit.py` | Rate Limiting Middleware |
| `frontend/src/App.tsx` | React Router + Seiten |
| `frontend/src/lib/api.ts` | API Client (Axios) |
| `frontend/src/types/cms.ts` | TypeScript Interfaces |
| `infrastructure/deploy/deploy.sh` | Production Deploy Script |
| `docker-compose.yml` | Lokale Entwicklung |
| `FEATURES.md` | Feature-Uebersicht |
| `COORDINATION.md` | Sprint-Status + Konventionen |
