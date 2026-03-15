# @contypio/client

Official TypeScript client for the [Contypio](https://contypio.com) Headless CMS Delivery API.

- **Zero dependencies** — uses native `fetch`
- **Full TypeScript support** with strict types and exported interfaces
- **Framework-agnostic** — works with any JS/TS stack
- **Universal runtime support** — Node.js 18+, Deno, Bun, Cloudflare Workers, browsers
- **ESM only**

> If your system can send HTTP requests and read JSON, it can use Contypio as a content source.
> This SDK covers the JS/TS ecosystem. For other languages (PHP, Python, Go, etc.), use the [REST API](../../docs/api-reference.md) directly.

### Where it runs

| Category | Examples |
|----------|---------|
| Static & Hybrid | Astro, Next.js, Nuxt, SvelteKit, Gatsby, Eleventy |
| Server & Edge | Node.js 18+, Deno, Bun, Cloudflare Workers, Vercel/Netlify Edge |
| Browser Frontends | React, Vue, Svelte, Solid, Angular |
| Mobile & Desktop | React Native, Expo, Electron, Tauri |

## Installation

```bash
npm install @contypio/client
```

## Quick Start

```typescript
import { createClient } from "@contypio/client";

const client = createClient({
  baseUrl: "https://cms.example.com",
});

// Get a page
const page = await client.pages.get("homepage");

// List blog posts
const blog = await client.collections.list("blog-posts", {
  sort: "-created_at",
  limit: 10,
});

// Get navigation tree
const tree = await client.pages.tree();

// Get all globals (footer, nav, settings)
const globals = await client.globals.all();
```

## Configuration

```typescript
const client = createClient({
  // Required — your Contypio instance URL
  baseUrl: "https://cms.example.com",

  // Optional — API key for scoped collection access
  apiKey: "cms_abc123…",

  // Optional — tenant slug (multi-tenant setups)
  tenant: "my-site",

  // Optional — custom fetch (e.g. for testing or edge runtimes)
  fetch: customFetchFn,
});
```

## Pages

```typescript
// Single page by slug
const page = await client.pages.get("about");

// With sparse fields (reduces payload)
const lite = await client.pages.get("about", {
  fields: ["title", "seo"],
});

// Include CSS for grid layouts
const full = await client.pages.get("about", { includeCss: true });

// List pages (paginated)
const result = await client.pages.list({ limit: 20, offset: 0 });
// result.items, result.total, result.has_more

// Filter by page type
const listings = await client.pages.list({ pageType: "listing" });

// Hierarchical tree (for navigation)
const tree = await client.pages.tree();
// [{ title, slug, path, children: [{ … }] }]

// Batch fetch — multiple pages in a single request (max 50)
const batch = await client.pages.batch(["home", "about", "blog"]);
// batch.items["home"]   → Page | null
// batch.not_found       → ["blog"]
```

## Collections

```typescript
// List items from a collection
const tours = await client.collections.list("tours");

// Sorting
const newest = await client.collections.list("blog", {
  sort: "-created_at",
});

// Filtering (bracket notation)
const premium = await client.collections.list("tours", {
  filter: {
    price: { gte: "100" },
    status: { eq: "active" },
  },
});

// Search
const results = await client.collections.list("products", {
  search: "beach",
  limit: 5,
});

// Cursor-based pagination (efficient for large datasets)
const page1 = await client.collections.list("tours", { limit: 50 });
const page2 = await client.collections.list("tours", {
  limit: 50,
  cursor: page1.next_cursor!,
});

// Async iterator — automatically pages through all items
for await (const tour of client.collections.iterate("tours")) {
  console.log(tour.title);
}

// Available filter operators: eq, ne, gt, gte, lt, lte, contains, in
```

## Globals

```typescript
// Single global
const footer = await client.globals.get("footer");
// { slug: "footer", label: "Footer", data: { … } }

// All globals (optimized for SSG builds)
const globals = await client.globals.all();
```

## Error Handling

```typescript
import { createClient, ContypioError, ContypioNetworkError } from "@contypio/client";

try {
  const page = await client.pages.get("nonexistent");
} catch (err) {
  if (err instanceof ContypioError) {
    // API error (RFC 7807 Problem Details)
    console.error(err.status);  // 404
    console.error(err.detail);  // "Page not found"
    console.error(err.type);    // "https://contypio.com/errors/not-found"

    if (err.isNotFound) { /* 404 */ }
    if (err.isRateLimited) { /* 429 */ }
    if (err.isUnauthorized) { /* 401/403 */ }
  }

  if (err instanceof ContypioNetworkError) {
    // Network failure (DNS, timeout, connection refused)
    console.error(err.message);
  }
}
```

## Retry on Rate Limit

The SDK automatically retries on HTTP 429 (Too Many Requests) with exponential backoff.
Default: 3 retries with 1s/2s/4s delays.

```typescript
// Custom retry config
const client = createClient({
  baseUrl: "https://cms.example.com",
  retry: { maxRetries: 5, initialDelayMs: 500 },
});

// Disable retries
const client = createClient({
  baseUrl: "https://cms.example.com",
  retry: false,
});
```

## Framework Examples

### Astro

```astro
---
// src/pages/[...slug].astro
import { createClient } from "@contypio/client";

const client = createClient({
  baseUrl: import.meta.env.CONTYPIO_URL,
});

export async function getStaticPaths() {
  const tree = await client.pages.tree();

  function flattenTree(nodes) {
    return nodes.flatMap(node => [
      { params: { slug: node.path.replace(/^\//, "") || undefined }, props: { slug: node.slug } },
      ...flattenTree(node.children),
    ]);
  }

  return flattenTree(tree);
}

const page = await client.pages.get(Astro.props.slug);
---

<html>
  <head><title>{page.title}</title></head>
  <body>
    <h1>{page.title}</h1>
  </body>
</html>
```

### Next.js (App Router)

```typescript
// app/[slug]/page.tsx
import { createClient } from "@contypio/client";

const client = createClient({
  baseUrl: process.env.CONTYPIO_URL!,
});

export async function generateStaticParams() {
  const { items } = await client.pages.list({ limit: 100 });
  return items.map(page => ({ slug: page.slug }));
}

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await client.pages.get(params.slug);
  return <h1>{page.title}</h1>;
}
```

### Nuxt 3

```typescript
// composables/useContypio.ts
import { createClient } from "@contypio/client";

export const useContypio = () => {
  const config = useRuntimeConfig();
  return createClient({ baseUrl: config.public.contypioUrl });
};
```

### SvelteKit

```typescript
// src/routes/[slug]/+page.server.ts
import { createClient } from "@contypio/client";
import { CONTYPIO_URL } from "$env/static/private";

const client = createClient({ baseUrl: CONTYPIO_URL });

export async function load({ params }) {
  const page = await client.pages.get(params.slug);
  return { page };
}
```

### Plain Node.js / Deno / Bun

```typescript
import { createClient } from "@contypio/client";

const client = createClient({ baseUrl: "https://cms.example.com" });

const page = await client.pages.get("homepage");
console.log(page.title);
```

## Types

All response types are exported and can be used directly:

```typescript
import type { Page, CollectionItem, Global, TreeNode, Media } from "@contypio/client";
```

## License

MIT
