# Contypio

<p align="center">
  <img src="frontend/public/contypio-logo.svg" alt="Contypio logo" width="220" />
</p>

<p align="center">
  <strong>Headless CMS for Astro with structured content and visual editing.</strong>
</p>

<p align="center">
  Contypio is a self-hosted, hybrid headless CMS that combines structured collections, globals, and a visual page builder in one platform.
</p>

<p align="center">
  <img src="docs/readme/screenshots/gui-dashboard.png" alt="Contypio dashboard screenshot" width="920" />
</p>

## ✨ Key Features

- **Hybrid headless CMS**: structured collections and visual pages in one system, without choosing between "pure headless" and "page builder".
- **Astro-first delivery**: clean `/content/*` endpoints and a typed TypeScript client for Astro and modern frontend stacks.
- **Visual page builder**: create landing pages and campaigns with reusable blocks and section-based layouts while still outputting structured data.
- **Globals for site-wide content**: manage navigation, branding, social links, and settings as singletons instead of scattered config files.
- **Self-hosted and Docker-friendly**: run Contypio on your own infrastructure for client projects, internal platforms, and agency stacks.
- **Multi-site and multi-tenant ready**: serve multiple properties from one installation and keep content clearly separated.

## 🚀 Why Contypio for Astro?

Astro works best with predictable data structures, fast static or hybrid rendering, and low runtime overhead. Contypio is designed to fit that workflow directly:

- model your content once and access it through stable `/content/*` endpoints
- use collections for repeatable content like blog posts, destinations, team members, or feature lists
- use globals for navigation, site settings, and social links instead of hard-coded JSON
- use the visual page builder for editorial pages, campaigns, and landing pages without losing content structure
- consume everything through a typed TypeScript client and an Astro starter path

Result: your Astro frontend stays fast, type-safe, and maintainable, while editors get a modern UI instead of markdown-only forms.

## 🖼️ Product Screenshots

<p align="center">
  <img src="docs/readme/screenshots/gui-login.png" alt="Contypio login screenshot" width="440" />
  <img src="docs/readme/screenshots/gui-collections.png" alt="Contypio collections screenshot" width="440" />
</p>

<p align="center">
  <img src="docs/readme/screenshots/gui-site-settings.png" alt="Contypio site settings screenshot" width="440" />
  <img src="docs/readme/screenshots/gui-page-editor.png" alt="Contypio page editor screenshot" width="440" />
</p>

## 🧩 Core Concepts

### Visual Page Builder

Compose pages visually using sections and reusable blocks, with a clear separation between layout and content. Editors can build and iterate on landing pages, campaigns, and content hubs without touching code, while developers still receive structured JSON.

### Collections

Define structured content models for repeatable entities such as:

- blog posts and articles
- destinations and locations
- products, plans, and pricing tables
- team members, case studies, FAQs, and more

Each collection has a schema, validation, and an API endpoint that is easy to consume from Astro.

### Globals

Use globals for singleton content that should exist exactly once:

- site configuration and branding
- navigation menus and footers
- default SEO metadata
- social media profiles and contact details

Globals keep site-wide content out of random config files and in a place where editors can manage it safely.

### Delivery API

Contypio exposes published content through simple REST endpoints for:

- pages
- collections
- globals
- locales / languages

This makes content consumption straightforward for Astro, but also for other frameworks if you mix frontends.

### TypeScript Integration

A dedicated TypeScript client and Astro-oriented integration path provide:

- fully typed responses
- a clear, discoverable API surface
- a stronger source of truth for frontend content usage

## 🎯 Best Fit

Contypio is a strong fit for:

- **Astro websites with dynamic editorial content**: blogs, marketing sites, content hubs, and docs-style properties
- **agencies managing multiple clients**: self-hosted control, no SaaS lock-in, reusable patterns across projects
- **self-hosted CMS needs**: run on Docker, VPS, or internal infrastructure while keeping data ownership in-house
- **teams that need both landing pages and structured content**: campaigns and collections live in the same system

## 🧪 Quick Start

```bash
git clone https://github.com/web-werkstatt/contypio.git
cd contypio
cp .env.example .env
docker compose up -d
```

Open `http://localhost:3000`.

Then:

- create your first collection, for example `posts` or `destinations`
- define globals for navigation, site settings, and SEO defaults
- create a page using the visual builder and a few reusable blocks
- connect Astro and fetch data from `/content/*` through the TypeScript client

## 🌌 Astro Integration Direction

Contypio is being positioned with Astro as a primary frontend target. Planned public integration includes:

- `packages/contypio-client/` for typed frontend consumption
- `starters/astro/` as reference implementation
- `docs/astro-go-live/` for Astro-focused documentation and launch planning

## 🏗️ Architecture

<p align="center">
  <img src="docs/readme/system-architecture.svg" alt="System architecture graphic" width="920" />
</p>

<p align="center">
  <img src="docs/readme/content-flow.svg" alt="Content flow graphic" width="920" />
</p>

- API-first backend for content delivery
- hybrid content model with collections, globals, and visual pages
- typed frontend integration path
- Docker-first deployment model
- multi-site and multi-tenant friendly setup

## ⚖️ Honest Trade-offs

Contypio is under active development and still has trade-offs compared to more established CMS tools:

- the Astro starter path is not yet fully productized
- the ecosystem is smaller than WordPress, Strapi, or Directus
- public examples and starter kits still need expansion
- onboarding is improving, but should become even more Astro-specific

If you prefer a focused, modern, self-hosted stack over a massive plugin marketplace, Contypio is designed for that use case.

## 🧭 Roadmap & Status

Current focus areas:

- deepening the Astro-first story with docs, starter, and launch material
- improving the visual page builder for marketing and content teams
- strengthening multi-site workflows for agencies and internal platforms

## 🔗 Learn More

- Product page: https://contypio.webideas24.com/
- Astro planning: `docs/astro-go-live/`
- TypeScript client: `packages/contypio-client/`

## 📄 License

Add the final public license information here.
