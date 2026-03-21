# CLAUDE.md - Contypio Project

## Projekt

Contypio ist ein Hybrid Headless CMS (Content Modeling + Page Builder).
Dieses Repo enthaelt den **gesamten** Produkt-Code:

- `backend/` — FastAPI REST API + Delivery API (Python)
- `frontend/` — React Admin UI (TypeScript)
- `hilfe-center/` — Self-Hosted Help Center (Flask + Markdown)
- `packages/contypio-client/` — TypeScript SDK (`@contypio/client`)
- `starters/astro/` — Astro Starter Template

## Verbindliche Spezifikationen

- `docs/api-roadmap-v1.md` — API-Erweiterungen + Security Hardening (Approved, 2026-03-15)
- Alle API-/SDK-Aenderungen orientieren sich an diesem Dokument.

## Session-Start Checklist

1. `next-session.md` lesen (Status, naechste Aufgaben, Deploy-Befehle)
2. `sessions/sprints/` lesen (aktuelle Sprint-Plaene)
3. `COORDINATION.md` lesen (Sprint-Status + Konventionen)
4. `FEATURES.md` lesen (Feature-Uebersicht)

## Architektur

| Komponente | Tech | Port (lokal) |
|---|---|---|
| Backend API | FastAPI + SQLAlchemy + PostgreSQL | 8060 |
| PostgreSQL | PostgreSQL 17 (Debian, ICU `und`) | 7460 |
| Admin Frontend | React 19 + TypeScript + shadcn/ui | 8061 |
| Hilfe-Center | Flask + Markdown | - |
| SDK | TypeScript (zero deps) | - |
| Astro Starter | Astro 4.x + Tailwind | - |

### Delivery API Endpoints

- `GET /content/pages/{slug}` — Einzelseite (primaer)
- `GET /content/pages` — Seitenliste (paginiert)
- `GET /content/collections/{key}` — Collection-Items (primaer)
- `GET /content/globals/{slug}` — Einzelnes Global
- `GET /content/globals/` — Alle Globals (Batch)
- `GET /content/tree` — Hierarchischer Seitenbaum

Sorting: `?sort=-title`, Filter: `?filter[field][op]=value`, Sparse: `?fields=title,slug`

## Code Standards

### Python (Backend)
- Type Hints ueberall (Decimal, Optional, List)
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

### SDK + Starter
- TypeScript strict, kein `any`
- ESM only (`"type": "module"`)
- Zero Runtime-Dependencies im SDK (nur native fetch)
- Englische Texte (internationaler GitHub-Launch)
- Astro 4.x + Tailwind CSS im Starter
- SSG-Modus (Static Site Generation) als Default

## Deployment

### Lokal
```bash
cp backend/.env.example backend/.env
docker compose up
```

### Production
```bash
./infrastructure/deploy/deploy.sh sync backend     # Python Code (~5s)
./infrastructure/deploy/deploy.sh sync frontend    # React Build (~30s)
./infrastructure/deploy/deploy.sh sync all         # Beides
./infrastructure/deploy/deploy.sh status           # Container-Status
./infrastructure/deploy/deploy.sh logs backend     # Logs
./infrastructure/deploy/deploy.sh health           # Health-Check
```

**Server:** 176.9.1.186 (pve3) -> Docker-VM 10.10.10.100 (SSH: `irtours-docker`)

**Production URLs:**
- https://cms.ir-tours.de (Admin UI)
- Delivery API via https://cms.ir-tours.de/content/

## Kommunikation

- KEINE Marketing-Sprache
- NUR Fakten, Status, Zahlen
