---
title: "Content Adapter"
icon: "arrow-repeat"
description: "Der zentrale Adapter fuer Navigation, Team, Settings und MegaMenu"
section: "Astro-Anbindung"
tags: [content-adapter, navigation, team, settings, typescript]
order: 13
---

## Was ist der Content Adapter?

Der Content Adapter ist eine TypeScript-Datei, die alle CMS-Abfragen zentralisiert.
Statt in jeder Astro-Seite einzelne `fetch()`-Aufrufe zu schreiben, nutzt man den Adapter.

**Datei:** `src/lib/content-adapters/index.ts`

## Zwei Adapter

```typescript
// Reisedaten (Slider, Testimonials) - von FastAPI
const contentAdapter = getContentAdapter();

// CMS-Daten (Navigation, Pages, Team, Settings) - von Python CMS
const cmsAdapter = getCmsAdapter();
```

## CMS Adapter - Methoden

| Methode | Liefert | API-Endpunkt |
|---|---|---|
| `getNavigation('main')` | Hauptmenue | `/content/globals/navigation` |
| `getTeamMembers()` | Team-Liste | `/content/collection/team-members` |
| `getSiteSettings()` | Firmen-Infos | `/content/globals/site-settings` |
| `getMegaMenuImages()` | MegaMenu-Bilder | `/content/collection/megamenu-bilder` |
| `getPage(slug)` | Seiten-Daten | `/content/page?slug=...` |
| `getPageBySlug(slug)` | Volle Seite mit Sections | `/content/page?slug=...` |
| `getPageByPath(path)` | Seite ueber Pfad | `/content/page?path=...` |
| `getTree()` | Seitenbaum | `/content/tree` |

## Verwendung in Astro-Seiten

```astro
---
import { getCmsAdapter } from '../lib/content-adapters';

const cms = getCmsAdapter();
const nav = await cms.getNavigation('main');
const settings = await cms.getSiteSettings();
const team = await cms.getTeamMembers();
---

<nav>
  {nav?.items.map(item => (
    <a href={item.url}>{item.label}</a>
  ))}
</nav>
```

## Wann Adapter vs. direkter fetch()?

| Situation | Empfehlung |
|---|---|
| Navigation, Team, Settings | Content Adapter (`getCmsAdapter()`) |
| Seitenspezifische Globals | Direkter `fetch()` im Frontmatter |
| Collections fuer eine Seite | Direkter `fetch()` im Frontmatter |
| Reisedaten | Content Adapter (`getContentAdapter()`) |

Der Adapter ist ideal fuer Daten, die auf **vielen Seiten** benoetigt werden (Navigation, Settings).
Fuer seitenspezifische Daten ist ein direkter `fetch()` einfacher und klarer.

## ENV-Variable

```
PUBLIC_CMS_URL=https://cms.ir-tours.de
```

Der Adapter liest diese Variable automatisch:
```typescript
const cmsUrl = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';
```
