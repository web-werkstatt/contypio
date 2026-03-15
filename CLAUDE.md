# CLAUDE.md - Contypio Project

## Projekt

Contypio ist ein Hybrid Headless CMS (Content Modeling + Page Builder).
Dieses Repo enthaelt den **gesamten** Produkt-Code:

- `backend/` — FastAPI REST API + Delivery API (Python)
- `frontend/` — React Admin UI (TypeScript)
- `hilfe-center/` — Self-Hosted Help Center (Flask + Markdown)
- `packages/contypio-client/` — TypeScript SDK (`@contypio/client`)
- `starters/astro/` — Astro Starter Template

## Session-Start Checklist

1. `sessions/sprints/` lesen (aktuelle Sprint-Plaene)
2. `COORDINATION.md` lesen (Sprint-Status + Konventionen)
3. `FEATURES.md` lesen (Feature-Uebersicht)
4. Pruefen welche Aufgaben offen sind

## Architektur

| Komponente | Tech | Port (lokal) |
|---|---|---|
| Backend API | FastAPI + SQLAlchemy + PostgreSQL | 8060 |
| Admin Frontend | React 19 + TypeScript + shadcn/ui | 8061 |
| PostgreSQL | PostgreSQL 17 | 7460 |
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
docker compose up
```

### Production (IR-Tours Referenz-Instanz)
```bash
# Im proj_irtours Verzeichnis:
./infrastructure/deploy/deploy-proxmox.sh sync cms          # Backend
./infrastructure/deploy/deploy-proxmox.sh sync cms-frontend  # Frontend
```

**Production URLs:**
- https://cms.ir-tours.de (Admin UI)
- Delivery API via https://cms.ir-tours.de/content/

## Kommunikation

- KEINE Marketing-Sprache
- NUR Fakten, Status, Zahlen
