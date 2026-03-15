---
title: "Collections in Astro verwenden"
icon: "collection"
description: "Wie man Collections (Listen) in Astro-Seiten einbindet"
section: "Astro-Anbindung"
tags: [collections, astro, listen, items, reise-themen, continent]
order: 12
tips:
  - "Collection-Items haben immer .data - dort stehen die eigentlichen Felder"
  - "items.map() zum Iterieren ueber die Eintraege"
---

## Was sind Collections?

Collections sind Listen von Eintraegen mit einheitlichem Schema, z.B. "reise-themen" (7 Themen) oder "continent-pages" (10 Kontinente).

## API-Aufruf

```
GET /content/collection/reise-themen
```

**Antwort:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Busreisen",
      "slug": "busreisen",
      "data": {
        "name": "Busreisen",
        "slug": "busreisen",
        "description": "Komfortable Busreisen...",
        "imageFallback": "/images/contao/busreisen-7a8fc5cf.jpg"
      },
      "sort_order": 0
    },
    {
      "id": 2,
      "title": "Flugreisen",
      "slug": "flugreisen",
      "data": { ... }
    }
  ],
  "total": 7
}
```

## Code-Muster in Astro

```javascript
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';

// Collection laden
let themes = [];
try {
  const res = await fetch(`${CMS_URL}/content/collection/reise-themen`);
  if (res.ok) {
    const data = await res.json();
    const rawItems = data.items || [];
    themes = rawItems.map(item => ({
      name: item.data?.name || item.title,
      slug: item.data?.slug || item.slug,
      description: item.data?.description || '',
      image: item.data?.imageFallback || '',
    }));
  }
} catch { /* Fallback */ }

// Fallback falls CMS nicht erreichbar
if (themes.length === 0) {
  themes = [
    { name: 'Busreisen', slug: 'busreisen', description: '...', image: '/images/...' },
    // ...
  ];
}
```

**Im Template:**
```html
{themes.map(theme => (
  <a href={`/reisethemen/${theme.slug}`}>
    <img src={theme.image} alt={theme.name} />
    <h3>{theme.name}</h3>
    <p>{theme.description}</p>
  </a>
))}
```

## Einzelnen Eintrag filtern

Collections liefern immer ALLE Eintraege. Zum Filtern:

```javascript
// Alle laden, dann client-side filtern
const res = await fetch(`${CMS_URL}/content/collection/continent-pages`);
const data = await res.json();
const items = data.items || [];
const match = items.find(i => i.slug === 'europa');
if (match) {
  // match.data.title, match.data.description, etc.
}
```

## Vorhandene Collections

| Collection-Key | Eintraege | Verwendet in |
|---|---|---|
| `reise-themen` | 7 Themen | alle-reisethemen.astro, [thema].astro |
| `continent-pages` | 10 Kontinente | [kontinent]/index.astro |
| `destination-pages` | Laender-Seiten | [kontinent]/[land].astro |
| `team-members` | Mitarbeiter | Content-Adapter (getTeamMembers) |
| `megamenu-bilder` | MegaMenu-Bilder | Content-Adapter (getMegaMenuImages) |
