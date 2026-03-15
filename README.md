# Contypio

Hybrid Headless CMS — Content Modeling + Page Builder in einem System.

Contypio kombiniert flexible Daten-Collections (wie Strapi/Directus) mit einem visuellen Seiten-Editor (wie WordPress) — als schlankes, self-hosted Headless CMS.

## Quick Start

```bash
git clone https://git.webideas24.com/webideas24/contypio.git
cd contypio
cp backend/.env.example backend/.env
docker compose up
```

- **Admin UI:** http://localhost:8061
- **API:** http://localhost:8060
- **API Docs:** http://localhost:8060/docs
- **Default Login:** admin@contypio.com / admin

## Architektur

```
contypio/
  backend/          FastAPI (Python) — REST API + Delivery API
  frontend/         React 19 + TypeScript — Admin UI
  hilfe-center/     Flask — Self-Hosted Help Center
  packages/
    contypio-client/  TypeScript SDK (@contypio/client)
  starters/
    astro/          Astro Starter Template
```

| Komponente | Tech Stack |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Pydantic |
| Frontend | React 19, TypeScript, Tailwind CSS, shadcn/ui, TipTap |
| Delivery API | REST + JSON, ETag/Cache-Control, RFC 7807 Errors |
| Auth | JWT + API Keys (Bearer Token mit Scopes) |

## Features

### Page Builder
- Visueller Section-Editor mit 6 Layout-Optionen
- 20+ Block-Typen (RichText, Hero, Gallery, Cards, CTA, FAQ, ...)
- Drag & Drop Sortierung
- Live Preview (Desktop, Tablet, Mobile)
- Page Versioning mit Revision-History

### Content Modeling
- Dynamische Collections mit Schema-Builder (kein Code)
- 16 Feld-Typen (Text, Number, Media, Relation, Repeater, ...)
- Auto-generierte CRUD-Formulare
- Schema Export/Import (YAML/JSON)

### Delivery API
- `GET /content/pages/{slug}` — Einzelseite mit aufgeloesten Sections
- `GET /content/pages` — Seitenliste (paginiert, filterbar)
- `GET /content/collections/{key}` — Collection-Items
- `GET /content/globals/{slug}` — Globale Konfiguration
- `GET /content/tree` — Hierarchischer Seitenbaum

Sorting: `?sort=-title`, `?sort=title:asc`
Filter: `?filter[field]=value`, `?filter[price][gte]=100`
Sparse Fields: `?fields=title,slug,seo`
Pagination: `?limit=20&offset=0`

### Multi-Tenant
- Isolierte Mandanten per Domain oder X-Tenant Header
- Eigene Benutzer, Inhalte, Media pro Tenant
- API Keys mit Scopes pro Tenant

### Weitere Features
- Media Library mit Ordnern und Drag & Drop Upload
- Webhook-System (Content Events an externe Services)
- i18n Admin UI (Deutsch + Englisch)
- Website-to-CMS Importer (HTML analysieren und importieren)
- AI Field Generation (OpenAI-kompatibel)
- Modul-System (Block-Typen pro Edition freischaltbar)
- Hilfe-Center (self-hosted, Markdown-basiert)

## Tech Stack

### Backend
- Python 3.13+
- FastAPI 0.115+
- SQLAlchemy 2.0+ (async)
- PostgreSQL 17
- Pydantic 2.10+

### Frontend
- React 19
- TypeScript (strict)
- Vite
- Tailwind CSS 4
- shadcn/ui (51 Komponenten)
- TipTap (WYSIWYG Editor)
- React Query (Server State)

## Development

### Voraussetzungen
- Docker + Docker Compose
- Node.js 22+ (fuer Frontend-Entwicklung)
- Python 3.13+ (fuer Backend-Entwicklung)

### Lokale Entwicklung (ohne Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8060 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Tests
```bash
cd backend
python -m pytest tests/ -v
```

## API Authentication

### Delivery API (oeffentlich)
Kein Auth noetig. Nur veroeffentlichte Inhalte.

### API Keys (optional)
```bash
curl -H "Authorization: Bearer cms_abc123..." \
  https://your-domain.com/content/collections/blog-posts
```

### Admin API (geschuetzt)
JWT Token via Login-Endpoint.

## Deployment

### Docker (empfohlen)
```bash
docker compose -f docker-compose.yml up -d
```

### Production
Siehe `backend/Dockerfile.proxmox` und `frontend/Dockerfile` fuer optimierte Production-Builds.

## Lizenz

Proprietaer — (c) webideas24. Alle Rechte vorbehalten.
