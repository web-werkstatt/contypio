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
| **Delivery API** | REST API with filtering, sorting, pagination, sparse fields, batch |
| **Media Library** | Drag & drop upload, auto WebP conversion, 3 thumbnail sizes |
| **Multi-Tenant** | Isolated tenants per domain or `X-Tenant` header |
| **i18n** | Field-level localization with fallback chains (BCP 47) |
| **TypeScript SDK** | `@contypio/client` — zero deps, native fetch, full types |
| **Security** | OWASP API Top 10 hardened, tiered rate limits, audit trail |

## Architecture

```
localhost:3000
     |
  [FastAPI]  ──>  [PostgreSQL]
   /  |  \
  /   |   \
 UI  /api/ /content/
```

Two containers. FastAPI serves Admin UI + API from one process (like Payload/Strapi).
No nginx required.

| Component | Tech |
|---|---|
| Backend + Admin | Python 3.13, FastAPI, SQLAlchemy, PostgreSQL 17 |
| Admin UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
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
POST /content/collections/{key}/batch  # Batch fetch by IDs or slugs (max 100)

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
**Localization:** `?locale=de` with fallback chains (`de-AT` -> `de` -> `en`)

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

// Batch
const result = await client.pages.batch(["home", "about", "blog"]);
// result.items (Page[]), result.missing (string[])

// Collections with cursor pagination
for await (const item of client.collections.iterate("blog-posts")) {
  console.log(item.title);
}

// Collection batch
const tours = await client.collections.batch("tours", { ids: [1, 2, 3] });

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
| `CONTYPIO_PORT` | `3000` | Port for Admin UI + API |
| `POSTGRES_PASSWORD` | - | Database password |
| `SECRET_KEY` | - | JWT signing key |
| `DEFAULT_ADMIN_EMAIL` | `admin@localhost` | First admin account |
| `DEFAULT_ADMIN_PASSWORD` | `admin` | First admin password |
| `SEED_DEMO` | `false` | Create demo content on first start |

### Commands

```bash
docker compose up -d              # Start
docker compose stop               # Stop
docker compose logs -f api        # View logs
docker compose down -v            # Reset everything
```

### Production with Reverse Proxy

Put Caddy or Traefik in front for HTTPS. No port exposure needed:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

```caddyfile
cms.example.com {
    reverse_proxy contypio-api-1:8060
}
```

See [`infrastructure/Caddyfile.example`](infrastructure/Caddyfile.example) for full examples.

### Multiple Instances on One Server

```bash
# Each instance gets its own name, port, and database
curl -fsSL https://get.contypio.com | bash -s -- --name client1 --port 3001
curl -fsSL https://get.contypio.com | bash -s -- --name client2 --port 3002

# Or behind reverse proxy (no ports exposed, Caddy routes by domain)
COMPOSE_PROJECT_NAME=client1 docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
COMPOSE_PROJECT_NAME=client2 docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### Multi-Tenant (One Instance, Multiple Sites)

Contypio is multi-tenant by default. One installation serves multiple websites.
Configure tenant domains in the Admin UI. Tenant resolution:
1. `X-Tenant` header (slug or domain)
2. `Host` header matched against tenant domain
3. Default tenant fallback

### Backup

```bash
# Database dump (gzipped)
docker compose exec postgres pg_dump -U contypio contypio | gzip > backup.sql.gz

# Restore
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U contypio contypio
```

## Development

```bash
# Start with dev overrides (hot-reload, DB port exposed)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Admin + API:   http://localhost:3000
# PostgreSQL:    localhost:7460
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

**API key types:**

| Type | Rate Limit | Use Case |
|---|---|---|
| `live` | 500 req/min | Production websites |
| `build` | 2000 req/min | SSG builds (Astro, Next.js) |
| No key | 100 req/min | Public access |

```bash
curl -H "Authorization: Bearer cms_abc123..." \
  https://cms.example.com/content/collections/blog-posts
```

**Key rotation** with grace period:
```bash
POST /api/api-keys/{id}/rotate?grace_hours=24
# Old key stays valid for 24h while you update your config
```

## Project Structure

```
contypio/
  backend/                     FastAPI + Admin UI (single container)
    app/
      api/                     Admin API endpoints
      auth/                    JWT + API key auth
      core/                    Config, i18n, rate limiting
      delivery/                Public Delivery API
      middleware/               Security headers, CORS, audit log
      models/                  SQLAlchemy models
      services/                Business logic
    migrations/                Alembic DB migrations
    tests/                     53 tests
  frontend/                    React Admin UI (built into backend image)
  packages/
    contypio-client/           TypeScript SDK (@contypio/client v0.3)
  docker-compose.yml           Default setup (2 containers, port 3000)
  docker-compose.dev.yml       Dev overrides (hot-reload, DB port)
  docker-compose.production.yml  Behind reverse proxy (no ports)
  install.sh                   One-command installer
  .env.example                 All configuration options
```

## Security

Hardened against OWASP API Security Top 10 (12 measures, 4 sprints):

| Measure | Description |
|---|---|
| **S1** Security Headers | CSP, X-Frame-Options, Permissions-Policy, X-Content-Type-Options |
| **S2** HSTS | Strict-Transport-Security (Caddy primary, FastAPI fallback) |
| **S3** CORS | Tenant-aware origins from DB, default deny-all |
| **S4** Filter Allowlist | Schema-based validation, max 10 filters, depth 3 |
| **S5** Key Hashing | SHA-256, no plaintext in DB |
| **S6** Key Rotation | Grace period (old + new key valid during transition) |
| **S7** Rate Limiting | Tiered: public 100/min, live 500/min, build 2000/min |
| **S8** Webhook Security | HMAC-SHA256 v2 signatures, timestamp replay protection |
| **S9** BOPLA | Internal fields stripped from all delivery responses |
| **S10** Audit Trail | DB-persisted, GDPR IP anonymization, 90d retention |
| **S11** Search Sanitization | LIKE pattern injection prevention |
| **S12** Tenant Isolation | 41 tenant_id checks across all services |

## License

Proprietary — (c) webideas24. All rights reserved.
