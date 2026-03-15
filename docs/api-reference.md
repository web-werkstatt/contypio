# Contypio Delivery API Reference

Base URL: `https://your-instance.example.com`

All Delivery API endpoints are **public** (no authentication required).
Optional API key authentication enables scoped collection access.

If your system can send HTTP requests and read JSON, it can use Contypio as a content source.

---

## Supported Platforms

There are two ways to consume the Contypio API:

### Via SDK (`@contypio/client`) — Modern JS/TS Stacks

- **Static & Hybrid:** Astro, Next.js, Nuxt, SvelteKit, Gatsby, Eleventy
- **Server & Edge:** Node.js 18+, Deno, Bun, Cloudflare Workers, Vercel/Netlify Edge
- **Browser Frontends:** React, Vue, Svelte, Solid, Angular — SPAs and MPAs
- **Mobile & Desktop:** React Native, Expo, Electron, Tauri

### Via REST API (without SDK) — Anything with an HTTP Client

- **PHP:** WordPress themes, headless WordPress, Laravel, Symfony
- **Python:** Django, Flask, FastAPI
- **Other Languages:** Ruby on Rails, Go, Rust, Java, .NET, Swift, Kotlin
- **No-/Low-Code & Automation:** Zapier, Make, n8n, Retool, Appsmith

### Typical Use Cases

- **Websites & Blogs** — corporate sites, landing pages, editorial content
- **E-Commerce** — product pages, catalogs, storefronts (headless commerce)
- **SaaS Applications** — help centers, changelogs, in-app content
- **Mobile Apps** — content-driven apps with offline-capable API
- **Multi-Channel** — digital signage, kiosks, email templates, print (via API)
- **Internal Tools** — dashboards, documentation portals, knowledge bases

---

## Authentication

The Delivery API is publicly accessible. For restricted collections, pass an API key:

```
Authorization: Bearer cms_<your-api-key>
```

API keys are scoped to specific collections or `*` (all). Invalid or expired keys return `401`/`403`.

---

## Pagination

All list endpoints return paginated results:

```json
{
  "items": [],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `limit` | integer | 20 | 1–100 | Items per page |
| `offset` | integer | 0 | >= 0 | Items to skip |

---

## Cursor Pagination

For large collections (100+ items), cursor-based pagination is more efficient than offset.
Instead of `OFFSET N` (which scans all skipped rows), cursors use keyset pagination.

```
# First page
GET /content/collections/tours?limit=50

# Next page using cursor from response
GET /content/collections/tours?limit=50&cursor=eyJpZCI6NTAsInNvcnQiOiJzb3J0X29yZGVyIiwidmFsdWUiOjUwfQ
```

When `cursor` is provided, `offset` is ignored. Both pagination styles can coexist — use
offset for simple cases, cursors for large datasets or infinite scroll.

The SDK provides an async iterator that handles cursor pagination automatically:

```typescript
for await (const item of client.collections.iterate("tours")) {
  console.log(item.title);
}
```

---

## Sorting

Supported on collection endpoints. Three syntax variants:

| Syntax | Example | Description |
|--------|---------|-------------|
| Prefix `-` | `?sort=-title` | Descending |
| Suffix `:asc`/`:desc` | `?sort=title:asc` | Explicit direction |
| Separate param | `?sort=title&order=desc` | Legacy style |

Allowed sort fields: `sort_order`, `title`, `slug`, `created_at`, `updated_at`.

---

## Filtering

Bracket-notation filters on collection endpoints:

```
?filter[field][operator]=value
```

| Operator | Example | Description |
|----------|---------|-------------|
| `eq` | `?filter[status][eq]=active` | Equals |
| `ne` | `?filter[status][ne]=draft` | Not equals |
| `gt` | `?filter[price][gt]=50` | Greater than |
| `gte` | `?filter[price][gte]=50` | Greater than or equal |
| `lt` | `?filter[price][lt]=200` | Less than |
| `lte` | `?filter[price][lte]=200` | Less than or equal |
| `contains` | `?filter[name][contains]=beach` | Substring (case-insensitive) |
| `in` | `?filter[tag][in]=news,blog` | One of (comma-separated) |

Multiple filters are combined with AND logic.

---

## Sparse Fields

Reduce response payload by requesting specific fields:

```
?fields=title,seo,sections
```

Always included: `id`, `slug`, `path`.
Available: `title`, `hero`, `seo`, `sections`, `page_type`, `published_at`, `collection_key`, `parent_id`.

---

## Caching

All responses include HTTP cache headers:

| Header | Description |
|--------|-------------|
| `Cache-Control` | `public, max-age=<s>, stale-while-revalidate=<s>` |
| `ETag` | Weak ETag (`W/"<hash>"`) for conditional requests |
| `Last-Modified` | RFC 7231 HTTP-date (when available) |

Conditional request support:
- `If-None-Match: W/"<etag>"` — returns `304 Not Modified` if unchanged
- `If-Modified-Since: <date>` — returns `304 Not Modified` if not updated

Cache durations by resource:

| Resource | max-age | stale-while-revalidate |
|----------|---------|------------------------|
| Single page | 30s | 120s |
| Page list | 30s | 120s |
| Page tree | 120s | 600s |
| Collection | 60s | 300s |
| Globals | 60s | 300s |

---

## Multi-Tenant

Tenant resolution order:
1. `X-Tenant` header (slug or domain)
2. `Host` header matched against configured domains
3. Default tenant from server config

---

## Endpoints

### GET /content/pages/{slug}

Get a single published page by slug with fully resolved sections, media, and dynamic blocks.

**Parameters:**

| Parameter | In | Type | Description |
|-----------|-----|------|-------------|
| `slug` | path | string | Page slug (required) |
| `fields` | query | string | Comma-separated field names |
| `include_css` | query | boolean | Include CSS for grid layouts (default: `false`) |

**Response: `200 OK`**

```json
{
  "id": 1,
  "title": "Homepage",
  "slug": "homepage",
  "path": "/",
  "page_type": "content",
  "collection_key": null,
  "seo": {
    "title": "Welcome",
    "description": "Our homepage"
  },
  "hero": {
    "variant": "image",
    "imageId": 42
  },
  "sections": [
    {
      "id": "sec-1",
      "layout": "container",
      "layout_resolved": {
        "key": "container",
        "grid_config": null,
        "css": null
      },
      "columns": [
        {
          "blocks": [
            {
              "blockType": "text",
              "data": {
                "content": "<p>Welcome to our site.</p>"
              }
            },
            {
              "blockType": "image",
              "data": {
                "imageId": 42,
                "image": {
                  "id": 42,
                  "url": "https://cms.example.com/uploads/hero.jpg",
                  "alt": "Hero image",
                  "width": 1920,
                  "height": 1080,
                  "sizes": {
                    "thumbnail": {
                      "url": "https://cms.example.com/uploads/hero_thumb.jpg",
                      "width": 300,
                      "height": 200
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "published_at": "2026-03-15T10:00:00"
}
```

**Errors:** `404 Not Found`

---

### GET /content/pages

List all published pages (paginated). Sections are **not** resolved for performance.

**Parameters:**

| Parameter | In | Type | Description |
|-----------|-----|------|-------------|
| `limit` | query | integer | Items per page (default: 20) |
| `offset` | query | integer | Items to skip (default: 0) |
| `page_type` | query | string | Filter by page type |
| `parent_id` | query | integer | Filter by parent page ID |
| `fields` | query | string | Comma-separated field names |

**Response: `200 OK`**

```json
{
  "items": [
    {
      "id": 1,
      "title": "Homepage",
      "slug": "homepage",
      "path": "/",
      "page_type": "content",
      "seo": {},
      "hero": {},
      "published_at": "2026-03-15T10:00:00"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

### GET /content/tree

Hierarchical page tree with parent-child relationships. Useful for navigation menus and sitemaps.

**Parameters:** None

**Response: `200 OK`**

```json
[
  {
    "id": 1,
    "title": "Homepage",
    "slug": "homepage",
    "path": "/",
    "page_type": "content",
    "children": [
      {
        "id": 2,
        "title": "About",
        "slug": "about",
        "path": "/about",
        "page_type": "content",
        "children": []
      },
      {
        "id": 3,
        "title": "Blog",
        "slug": "blog",
        "path": "/blog",
        "page_type": "listing",
        "children": []
      }
    ]
  }
]
```

---

### POST /content/pages/batch

Fetch multiple pages in a single request. Optimized for SSG builds that need many pages at once.

**Request Body:**

```json
{
  "slugs": ["homepage", "about", "contact", "blog"],
  "fields": "title,seo,sections",
  "include_css": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `slugs` | string[] | Page slugs to fetch (required, max 50) |
| `fields` | string | Comma-separated sparse fields (optional) |
| `include_css` | boolean | Include CSS for grid layouts (default: `false`) |

**Response: `200 OK`**

```json
{
  "items": {
    "homepage": { "id": 1, "title": "Homepage", "slug": "homepage", "..." : "..." },
    "about": { "id": 2, "title": "About", "slug": "about", "..." : "..." },
    "contact": null,
    "blog": { "id": 4, "title": "Blog", "slug": "blog", "..." : "..." }
  },
  "resolved": 3,
  "not_found": ["contact"]
}
```

Pages that don't exist return `null` in the items map and are listed in `not_found`.
No 404 error is thrown for missing pages — the response is always 200.

**Errors:** `422 Validation Error` (more than 50 slugs, empty list)

---

### GET /content/collections/{key}

Fetch paginated items from a collection. Media references and relations are automatically resolved.

**Parameters:**

| Parameter | In | Type | Description |
|-----------|-----|------|-------------|
| `key` | path | string | Collection key (required) |
| `limit` | query | integer | Items per page (default: 20) |
| `offset` | query | integer | Items to skip (default: 0) |
| `cursor` | query | string | Opaque cursor from previous response (overrides offset) |
| `sort` | query | string | Sort field (default: `sort_order`) |
| `search` | query | string | Full-text search in title and data |
| `filter[field][op]` | query | string | Bracket-notation filter |

**Response: `200 OK`**

```json
{
  "items": [
    {
      "id": 101,
      "title": "Beach Tour Maldives",
      "slug": "beach-tour-maldives",
      "sort_order": 1,
      "image_id": 55,
      "data": {
        "price": 2499,
        "duration": "7 days",
        "description": "Luxury beach vacation...",
        "coverImage": {
          "id": 55,
          "url": "https://cms.example.com/uploads/maldives.jpg",
          "alt": "Maldives beach",
          "width": 1600,
          "height": 900,
          "sizes": {}
        },
        "category": {
          "id": 10,
          "title": "Beach Holidays",
          "slug": "beach-holidays"
        }
      }
    }
  ],
  "total": 156,
  "limit": 20,
  "offset": 0,
  "has_more": true,
  "next_cursor": "eyJpZCI6MTIwLCJzb3J0Ijoic29ydF9vcmRlciIsInZhbHVlIjoyMH0",
  "prev_cursor": "eyJpZCI6MTAxLCJzb3J0Ijoic29ydF9vcmRlciIsInZhbHVlIjoxfQ"
}
```

**Cursor Pagination:** When `cursor` is provided, `offset` is ignored. The cursor uses keyset pagination (`WHERE (sort_col, id) > (value, cursor_id)`) which is efficient even for large datasets. Both `next_cursor` and `prev_cursor` are returned when applicable.

**Errors:** `404 Not Found` (collection does not exist), `401 Unauthorized` (invalid API key), `403 Forbidden` (API key lacks scope), `400 Bad Request` (invalid cursor format)

---

### GET /content/globals/{slug}

Get a single global configuration. Media references are automatically resolved.

**Parameters:**

| Parameter | In | Type | Description |
|-----------|-----|------|-------------|
| `slug` | path | string | Global slug (required) |

**Response: `200 OK`**

```json
{
  "slug": "footer",
  "label": "Footer",
  "data": {
    "copyright": "2026 Example Inc.",
    "links": [
      { "label": "Privacy", "url": "/privacy" },
      { "label": "Imprint", "url": "/imprint" }
    ],
    "logo": {
      "id": 12,
      "url": "https://cms.example.com/uploads/logo.svg",
      "alt": "Logo",
      "width": 200,
      "height": 60,
      "sizes": {}
    }
  }
}
```

**Errors:** `404 Not Found`

---

### GET /content/globals/

Get all globals in a single batch request. Optimized for static site builds.

**Parameters:** None

**Response: `200 OK`**

```json
[
  {
    "slug": "footer",
    "label": "Footer",
    "data": { "copyright": "2026 Example Inc." }
  },
  {
    "slug": "main-navigation",
    "label": "Main Navigation",
    "data": { "items": [] }
  }
]
```

---

## Error Format (RFC 7807)

All errors follow the [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807) format.

**Content-Type:** `application/problem+json`

```json
{
  "type": "https://contypio.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Page with slug 'nonexistent' not found"
}
```

Validation errors include field-level details:

```json
{
  "type": "https://contypio.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Request validation failed",
  "errors": [
    {
      "field": "limit",
      "message": "ensure this value is less than or equal to 100",
      "type": "value_error"
    }
  ]
}
```

**Error Types:**

| Status | Type Slug | Title |
|--------|-----------|-------|
| 400 | `bad-request` | Bad Request |
| 401 | `unauthorized` | Unauthorized |
| 403 | `forbidden` | Forbidden |
| 404 | `not-found` | Not Found |
| 405 | `method-not-allowed` | Method Not Allowed |
| 409 | `conflict` | Conflict |
| 422 | `validation-error` | Validation Error |
| 429 | `rate-limit-exceeded` | Too Many Requests |
| 500 | `internal-error` | Internal Server Error |

---

## Rate Limiting

Default: **100 requests per 60 seconds** per client (by API key or IP).

Response headers on every request:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Seconds until window resets |

When exceeded: `429 Too Many Requests` with `Retry-After` header.

---

## Media Object

Resolved media references follow this structure throughout all endpoints:

```json
{
  "id": 42,
  "url": "https://cms.example.com/uploads/image.jpg",
  "alt": "Description",
  "width": 1920,
  "height": 1080,
  "sizes": {
    "thumbnail": {
      "url": "https://cms.example.com/uploads/image_thumb.jpg",
      "width": 300,
      "height": 200
    },
    "medium": {
      "url": "https://cms.example.com/uploads/image_medium.jpg",
      "width": 800,
      "height": 450
    }
  }
}
```

Media IDs in block data (`imageId`, `image_id`, `mediaId`) are automatically resolved to full media objects. The original ID field is preserved alongside the resolved object.

---

## Webhooks

Contypio fires webhooks on content changes. Configure webhook URLs in the Admin UI.

**Events:**

| Event | Trigger |
|-------|---------|
| `page.created` | New page created |
| `page.updated` | Page content updated |
| `page.published` | Page status changed to published |
| `page.unpublished` | Page unpublished |
| `page.deleted` | Page deleted |
| `collection.item_created` | New collection item |
| `collection.item_updated` | Collection item updated |
| `collection.item_deleted` | Collection item deleted |
| `media.uploaded` | New media file uploaded |
| `media.deleted` | Media file deleted |
| `global.updated` | Global configuration updated |
| `test.ping` | Manual test ping |

**Payload:**

```json
{
  "event": "page.published",
  "timestamp": "2026-03-15T10:00:00Z",
  "data": { }
}
```

**Security Headers:**

| Header | Description |
|--------|-------------|
| `X-CMS-Event` | Event name |
| `X-CMS-Signature` | HMAC-SHA256 signature (`sha256=<hex>`) |
| `User-Agent` | `Contypio-Webhooks/1.0` |

Verify the signature by computing `HMAC-SHA256(webhook_secret, request_body)` and comparing with the `X-CMS-Signature` header value.

---

## OpenAPI / Swagger

Interactive API documentation is available at:

```
https://your-instance.example.com/docs
```
