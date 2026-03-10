# Sprint: Contypio GitHub-Launch — Technische Vorbereitung

**Erstellt:** 2026-03-10
**Branch:** `issue-XX-contypio-github-launch`
**Status:** GEPLANT
**Geschätzter Aufwand:** 3-4 Sessions

---

## Kontext

Contypio (cms-python) wird als SaaS vermarktet. Der CMS-Code bleibt proprietär. Auf GitHub kommen:
- **TypeScript SDK** (`@contypio/client`) — generischer API-Client
- **Astro Starter Template** — Referenz-Frontend
- **Demo Seed** — neutrale Beispieldaten

**Ausgangslage:**
- Delivery API existiert: `/content/page`, `/content/pages`, `/content/tree`, `/content/collection/{key}`, `/content/globals/` + `/{slug}`
- TypeScript Adapter existiert: `frontend-webseite/astro-frontend/src/lib/content-adapters/python-cms.ts`
- Multi-Tenant via `tenant_id` (Header oder Domain-basiert)
- App heißt bereits "Contypio API" in `cms-python/backend/app/main.py`

---

## Aufgabe 1: TypeScript SDK extrahieren (`@contypio/client`)

**Priorität:** HOCH (Basis für alles)
**Quelle:** `frontend-webseite/astro-frontend/src/lib/content-adapters/python-cms.ts`

### Ziel-Struktur
```
packages/contypio-client/
  src/
    index.ts          # Re-Export: createContypioClient + alle Types
    types.ts          # Page, Section, Block, Column, TreeItem, Global, Collection
    client.ts         # createContypioClient(baseUrl, opts?) + fetchJson
  package.json        # name: "@contypio/client", type: "module", exports
  tsconfig.json       # strict, ESM, declaration: true
  README.md
```

### Tasks

- [ ] **1.1** Verzeichnis `packages/contypio-client/` anlegen
- [ ] **1.2** `types.ts` — generische CMS-Types extrahieren:
  - `ContypioSection` (aus `CmsSection`) — id, layout, background, spacing, columns[blocks]
  - `ContypioBlock` — id, blockType, data
  - `ContypioPage` (aus `CmsPageData`) — id, title, slug, path, page_type, seo, hero, sections, published_at
  - `ContypioTreeItem` (aus `CmsTreeItem`) — id, title, slug, path, page_type, children
  - `ContypioGlobal` (aus `CmsGlobalItem`) — slug, label, data
  - `ContypioCollectionResponse<T>` — items, total, limit, offset, has_more
  - `ContypioCollectionItem<T>` — id, title, slug, data
  - `ContypioClientOptions` — timeout?, retries?, onError?
  - **KEINE** IR-Tours-spezifischen Types (SliderItem, TeamMember, SiteSettingsData, MegaMenuImage, etc.)
- [ ] **1.3** `client.ts` — Adapter-Logik übernehmen und generalisieren:
  - `fetchJson<T>()` mit Retry + AbortController (aus bestehendem Code)
  - `createContypioClient(baseUrl, opts?)` mit Methoden:
    - `getPage(pathOrSlug, opts?)` → `ContypioPage | null` (path= oder slug= Parameter)
    - `getPages(opts?)` → `PaginatedResponse<ContypioPage>`
    - `getTree()` → `ContypioTreeItem[]`
    - `getGlobals()` → `ContypioGlobal[]` (mit internem Cache wie bisher)
    - `getGlobal(slug)` → `ContypioGlobal | null`
    - `getCollection(key, opts?)` → `ContypioCollectionResponse`
  - **ENTFERNEN:** getSliderItems, getTestimonials, getNavigation, getTeamMembers, getSiteSettings, getMegaMenuImages
  - **ENTFERNEN:** CmsAdapter-Interface-Kompatibilität (getPage mit Layout-Mapping)
- [ ] **1.4** `index.ts` — Re-Export von client + types
- [ ] **1.5** `package.json` erstellen:
  ```json
  {
    "name": "@contypio/client",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } },
    "scripts": { "build": "tsc", "dev": "tsc --watch" },
    "devDependencies": { "typescript": "^5.5.0" }
  }
  ```
- [ ] **1.6** `tsconfig.json` — strict, target ES2022, module NodeNext, declaration: true, outDir: dist
- [ ] **1.7** `README.md` — kurze Doku mit Quick Start + API Reference

### Akzeptanzkriterien
- `cd packages/contypio-client && npm install && npm run build` kompiliert fehlerfrei
- Keine `any` Types, keine IR-Tours-Referenzen
- Alle 6 Methoden typsicher exportiert
- Zero Runtime-Dependencies (nur native fetch)

---

## Aufgabe 2: Astro Starter Template

**Priorität:** HOCH
**Abhängigkeit:** Aufgabe 1 (SDK)

### Ziel-Struktur
```
starters/astro/
  src/
    layouts/
      BaseLayout.astro       # HTML-Grundgerüst, Fonts, Meta
    pages/
      index.astro            # Homepage — holt / rendert Sections
      [...slug].astro        # Dynamische CMS-Seiten (getStaticPaths von Tree)
    components/
      blocks/
        RichText.astro       # blockType: "richtext"
        Image.astro          # blockType: "image"
        Cards.astro          # blockType: "cards"
        Cta.astro            # blockType: "cta"
        Faq.astro            # blockType: "faq"
        Gallery.astro        # blockType: "gallery"
      SectionRenderer.astro  # Iteriert Section.columns → BlockRenderer
      BlockRenderer.astro    # Switch über blockType → Block-Komponente
    lib/
      contypio.ts            # createContypioClient(import.meta.env.CONTYPIO_URL)
  public/
    favicon.svg
  .env.example               # CONTYPIO_URL=https://app.contypio.com
  astro.config.mjs           # Tailwind Integration
  package.json               # astro, @astrojs/tailwind, @contypio/client (workspace)
  tailwind.config.mjs        # Minimal: content paths
  README.md
```

### Tasks

- [ ] **2.1** `starters/astro/` Verzeichnis anlegen, `package.json` erstellen
  - Astro 4.x, `@astrojs/tailwind`, `@contypio/client` als `file:../../packages/contypio-client`
- [ ] **2.2** `astro.config.mjs` + `tailwind.config.mjs` — minimal, SSG-Modus
- [ ] **2.3** `lib/contypio.ts` — Client-Instanz aus `CONTYPIO_URL` ENV
- [ ] **2.4** `BaseLayout.astro` — neutrales HTML-Grundgerüst (System Font Stack, Meta Tags)
- [ ] **2.5** `BlockRenderer.astro` + `SectionRenderer.astro` — generische Renderer
  - SectionRenderer: Iteriert Sections → Columns → BlockRenderer
  - BlockRenderer: Switch auf blockType, rendert passende Block-Komponente
  - Fallback für unbekannte Block-Types (zeigt blockType-Name + JSON)
- [ ] **2.6** 6 Block-Komponenten erstellen:
  - `RichText.astro` — rendert HTML-String aus data.content
  - `Image.astro` — Bild mit alt, optional caption
  - `Cards.astro` — Grid aus Karten (title, text, image, link)
  - `Cta.astro` — Call-to-Action (heading, text, button_text, button_link)
  - `Faq.astro` — Accordion mit Fragen/Antworten
  - `Gallery.astro` — Bildergalerie-Grid
- [ ] **2.7** `index.astro` — Homepage (getPage("/") + SectionRenderer)
- [ ] **2.8** `[...slug].astro` — dynamische Seiten (getStaticPaths via getTree)
- [ ] **2.9** `.env.example` + `public/favicon.svg`

### Akzeptanzkriterien
- `cd starters/astro && npm install && npm run dev` startet ohne Fehler
- Homepage rendert Sections/Blocks wenn CONTYPIO_URL gesetzt
- Dynamische Seiten via [...slug] funktionieren
- Kein IR-Tours Branding, neutrales Design
- Tailwind-basiertes Styling (kein Custom CSS)

---

## Aufgabe 3: Generische Demo-Seed-Daten

**Priorität:** MITTEL
**Abhängigkeit:** Keine (Backend-seitig)
**Quelle:** `cms-python/backend/app/services/seed_collections.py`

### Ziel
Neues Script `cms-python/backend/app/services/seed_demo.py` das eine neutrale Demo-Website erstellt.

### Demo-Inhalt

**Pages:**
| Seite | Path | Sections |
|-------|------|----------|
| Homepage | `/` | Hero (image Block) + 3 Feature-Cards + CTA + FAQ |
| Über uns | `/about` | RichText (Firmengeschichte) + Cards (Team-Grid) |
| Blog | `/blog` | Collection-Listing (blog-posts) |
| Kontakt | `/contact` | RichText (Adresse) + CTA (Kontaktformular-Teaser) |

**Collection "blog-posts":**
3 Beispiel-Artikel mit title, slug, data (content, author, date, excerpt, image-Platzhalter)

**Globals:**
- `site-settings`: site_name "Demo Company", contact_email, contact_phone
- `navigation`: main_menu mit Links zu allen 4 Seiten

### Tasks

- [ ] **3.1** `seed_demo.py` erstellen — Funktion `seed_demo_content(db, tenant_id)`
- [ ] **3.2** 4 Demo-Pages mit Sections/Blocks (JSON-Strukturen)
  - Blöcke verwenden dieselben blockTypes wie die Block-Komponenten im Starter
- [ ] **3.3** Collection-Schema "blog-posts" + 3 Collection-Items
- [ ] **3.4** Globals: site-settings + navigation
- [ ] **3.5** ENV-Flag `SEED_DEMO=true` in `main.py` Startup-Hook einbauen
  - Prüft ob bereits Demo-Daten existieren (idempotent)
- [ ] **3.6** Texte neutral und englisch (internationaler Launch)

### Akzeptanzkriterien
- `SEED_DEMO=true` erstellt alle Daten beim Start
- Wiederholter Start erzeugt keine Duplikate
- Alle Block-Types matchen die Starter-Komponenten (richtext, image, cards, cta, faq, gallery)
- Kein IR-Tours-Bezug in den Demo-Daten

---

## Aufgabe 4: Dev/Sandbox-Tenant-Flag im Backend

**Priorität:** MITTEL
**Begründung:** Keine separate "Developer Edition" nötig. Stattdessen ein `is_sandbox`-Flag
am Tenant, das Sandbox-Projekte von Produktiv-Tenants unterscheidet. Entwickler arbeiten
gegen die normale SaaS-Instanz — nur mit gelockerten Limits und einem Reset-Mechanismus.

### Was sich ändert gegenüber dem ursprünglichen Plan
- ~~Docker Compose mit lokalem CMS-Build~~ → **Nicht nötig.** Starter zeigt auf Cloud-URL.
- Stattdessen: Backend-seitiges Flag `is_sandbox` am Tenant-Model + Seed-Endpoint.

### Tasks

- [ ] **4.1** `CmsTenant`-Model erweitern: `is_sandbox: bool = False`
  - Alembic-Migration erstellen
- [ ] **4.2** Sandbox-spezifisches Verhalten:
  - Rate-Limits lockerer für Sandbox-Tenants (oder keine)
  - Kein CDN-Cache für Sandbox (Cache-Header: `no-cache` wenn `is_sandbox`)
  - Optional: Watermark/Banner-Hinweis in API-Response-Header (`X-Contypio-Sandbox: true`)
- [ ] **4.3** Seed-Endpoint: `POST /admin/seed-demo` (nur für Sandbox-Tenants, Auth erforderlich)
  - Ruft `seed_demo_content()` auf
  - Alternativ: Reset-Endpoint `POST /admin/reset-sandbox` — löscht alle Daten und seeded neu
- [ ] **4.4** Demo-Tenant bei Account-Erstellung:
  - Wenn neuer Account erstellt wird → automatisch ein Sandbox-Tenant mit Demo-Daten
  - `DEFAULT_TENANT_SLUG=demo` + `SEED_DEMO=true` bleibt für den globalen Demo-Tenant

### Akzeptanzkriterien
- Sandbox-Tenants sind in der DB markiert (`is_sandbox=True`)
- API-Responses enthalten `X-Contypio-Sandbox: true` Header für Sandbox-Tenants
- Demo-Seed funktioniert über Admin-API (nicht nur ENV-Flag beim Start)
- Kein separates Docker-Image oder separate Infrastruktur nötig

---

## Aufgabe 5: README als Landing Page

**Priorität:** MITTEL

### Tasks

- [ ] **5.1** `starters/astro/README.md` — professionelles Starter-README:
  - Quick Start (3 Befehle: clone, env, dev)
  - What's Included (Block-Komponenten, Routing, SDK, Tailwind)
  - Project Structure (Verzeichnisbaum)
  - Customization Guide (eigene Blocks hinzufügen)
  - Links zu docs.contypio.com, demo.contypio.com, app.contypio.com
- [ ] **5.2** `packages/contypio-client/README.md` — SDK-Doku:
  - Installation
  - Quick Start
  - API Reference (alle 6 Methoden mit Signatur + Beispiel)
  - TypeScript Types

### Akzeptanzkriterien
- Quick Start funktioniert in < 5 Minuten (für erfahrene Entwickler)
- Keine IR-Tours-Referenzen
- Links sind Platzhalter (docs.contypio.com etc. existieren noch nicht)

---

## Reihenfolge

```
Session 1:  Aufgabe 1 (SDK komplett) + Aufgabe 2.1-2.5 (Starter Grundgerüst)
Session 2:  Aufgabe 2.6-2.9 (Starter Blocks + Pages) + Aufgabe 3 (Demo Seed)
Session 3:  Aufgabe 4 (Sandbox-Flag) + Aufgabe 5 (READMEs) + Verifizierung
```

---

## Verifizierung (Definition of Done)

- [ ] `cd packages/contypio-client && npm run build` — keine Fehler
- [ ] `cd starters/astro && npm install && npm run build` — keine Fehler
- [ ] Starter zeigt Demo-Seiten wenn gegen laufende Contypio-Instanz verbunden
- [ ] SDK hat 0 Runtime-Dependencies, 0 `any` Types
- [ ] Kein IR-Tours Branding oder proprietärer Code in packages/ oder starters/
- [ ] Alle Block-Types konsistent zwischen Seed, SDK-Types und Starter-Komponenten

---

## Kritische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| SDK als lokales Package (kein npm publish) | Für Launch reicht file:-Referenz, npm publish kommt später |
| Englische Demo-Daten | Internationaler GitHub-Launch, nicht nur DACH |
| Kein Auth im SDK | Delivery API ist public (read-only), Auth kommt mit Admin SDK |
| SSG-Modus im Starter | Best Practice für CMS-Websites, SSR optional via Config |
| Tenant-Header nicht im SDK | Wird über Server-Config (Domain-Routing) gelöst, nicht Client-seitig |
| Keine "Developer Edition" / kein lokales Docker | Normale SaaS-Instanz + Sandbox-Tenant reicht. Entwickler zeigen auf Cloud-URL. Kein separates Image nötig. |
| Sandbox-Flag statt separater Umgebung | Ein `is_sandbox`-Bool am Tenant ermöglicht Dev/Prod-Unterscheidung ohne Infrastruktur-Overhead |
