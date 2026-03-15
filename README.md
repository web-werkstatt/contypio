# Contypio

**Hybrid Headless CMS** — Content Modeling + Page Builder in one system.

Contypio combines flexible data collections (like Strapi/Directus) with a visual page editor (like WordPress) — as a lightweight, self-hosted headless CMS.

## Quick Start

### One command:

```bash
curl -fsSL https://get.contypio.com | bash
```

### Or manually:

```bash
git clone https://github.com/contypio/contypio.git
cd contypio
cp .env.example .env    # edit passwords
docker compose up -d
```

Open **http://localhost:3000** — done.

Default login: `admin@localhost` / `admin` (change in `.env` before first start).

## What You Get

| Feature | Description |
|---|---|
| **Page Builder** | Visual section editor, 15+ block types, drag & drop, live preview |
| **Collections** | Dynamic data schemas with 16 field types — no code needed |
| **Globals** | Site settings, navigation, social media — managed centrally |
| **Delivery API** | REST API with filtering, sorting, pagination, sparse fields |
| **Media Library** | Drag & drop upload, auto WebP conversion, 3 thumbnail sizes |
| **Multi-Tenant** | Isolated tenants per domain or `X-Tenant` header |
| **i18n** | Field-level localization with fallback chains (BCP 47) |
| **TypeScript SDK** | `@contypio/client` — zero deps, native fetch, full types |

## Architecture

```
localhost:3000
     |
   [nginx]
   /  |  \
  /   |   \
UI  /api/  /content/  -->  [FastAPI]  -->  [PostgreSQL]
```

| Component | Tech |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy, PostgreSQL 17 |
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Delivery API | REST + JSON, ETag caching, RFC 7807 errors |
| SDK | TypeScript, ESM, zero runtime dependencies |

## Delivery API

```bash
# Pages
GET /content/pages/{slug}              # Single page (sections resolved)
GET /content/pages                     # Paginated list
GET /content/pages/{slug}?locale=de    # Localized content
GET /content/tree                      # Hierarchical page tree
POST /content/pages/batch              # Batch fetch (max 50)

# Collections
GET /content/collections/{key}         # Paginated items
GET /content/collections/{key}?sort=-title&filter[price][gte]=100

# Globals
GET /content/globals/{slug}            # Single global
GET /content/globals/                  # All globals (batch)

# i18n
GET /content/locales                   # Available locales
GET /content/pages/{slug}/locales      # Translation completeness
```

**Sorting:** `?sort=-title`, `?sort=title:asc`
**Filtering:** `?filter[field][op]=value` (eq, ne, gt, gte, lt, lte, contains, in)
**Sparse Fields:** `?fields=title,slug,seo`
**Pagination:** `?limit=20&offset=0` or cursor-based `?cursor=...`

## TypeScript SDK

```bash
npm install @contypio/client
```

```typescript
import { createClient } from "@contypio/client";

const client = createClient({
  baseUrl: "https://cms.example.com",
  locale: "de",  // optional default locale
});

// Pages
const page = await client.pages.get("homepage");
const tree = await client.pages.tree();

// Collections with cursor pagination
for await (const item of client.collections.iterate("blog-posts")) {
  console.log(item.title);
}

// Globals
const settings = await client.globals.get("site-settings");

// Locales
const { locales, default: defaultLocale } = await client.locales.list();
```

## Self-Hosting

### Requirements

- Docker + Docker Compose
- 1 GB RAM minimum
- PostgreSQL 17 (included in Docker setup)

### Configuration

All settings via `.env` file. See [`.env.example`](.env.example) for all options.

| Variable | Default | Description |
|---|---|---|
| `CONTYPIO_PORT` | `3000` | Port for the Admin UI |
| `POSTGRES_PASSWORD` | - | Database password |
| `SECRET_KEY` | - | JWT signing key |
| `DEFAULT_ADMIN_EMAIL` | `admin@localhost` | First admin account |
| `DEFAULT_ADMIN_PASSWORD` | `admin` | First admin password |
| `SEED_DEMO` | `false` | Create demo content on first start |

### Commands

```bash
docker compose up -d              # Start
docker compose stop               # Stop
docker compose logs -f api        # View API logs
docker compose down -v            # Reset everything
```

### Production with Reverse Proxy

Put Caddy/nginx/Traefik in front for HTTPS:

```caddyfile
cms.example.com {
    reverse_proxy localhost:3000
}
```

## Development

```bash
# Start with dev overrides (hot-reload, exposed ports)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Backend API:  http://localhost:8060
# PostgreSQL:   localhost:7460
# Admin UI:     http://localhost:3000
```

### Without Docker

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

## API Authentication

| Endpoint | Auth | Description |
|---|---|---|
| `/content/*` | None | Public delivery API (read-only, published content) |
| `/content/collections/*` | Optional API key | Scoped access per collection |
| `/api/*` | JWT (Bearer) | Admin API (full CRUD) |

API keys:
```bash
curl -H "Authorization: Bearer cms_abc123..." \
  https://cms.example.com/content/collections/blog-posts
```

## Project Structure

```
contypio/
  backend/                 FastAPI REST API + Delivery API
  frontend/                React Admin UI
  hilfe-center/            Self-hosted help center (Flask + Markdown)
  packages/
    contypio-client/       TypeScript SDK (@contypio/client v0.3)
  starters/
    astro/                 Astro starter template
  docker-compose.yml       Production setup (single port)
  docker-compose.dev.yml   Development overrides
  install.sh               One-command installer
```

## Security

- OWASP API Security Top 10 hardened
- Security headers (CSP, HSTS, X-Frame-Options, ...)
- Tenant-aware CORS (origins per tenant from DB)
- Filter field allowlist (schema-based validation)
- API key hashing (SHA-256)
- Argon2 password hashing
- Input validation via Pydantic

## License

Proprietary — (c) webideas24. All rights reserved.
