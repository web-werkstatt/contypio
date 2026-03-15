---
title: "Delivery API"
icon: "braces"
description: "Alle API-Endpunkte zum Abrufen von CMS-Inhalten"
section: "Architektur & Grundlagen"
tags: [api, endpunkte, json, content, delivery]
order: 2
tips:
  - "Alle Endpunkte sind GET-Requests ohne Authentifizierung"
  - "Basis-URL lokal: http://localhost:8060"
  - "Basis-URL Production: https://cms.ir-tours.de"
---

## API-Endpunkte

Die Delivery API liefert CMS-Inhalte als JSON. Kein Login erforderlich.

### Seiten abrufen

```
GET /content/page?slug=service
GET /content/page?path=/service
```

**Antwort:**
```json
{
  "id": 5,
  "title": "Service",
  "slug": "service",
  "path": "/service",
  "page_type": "content",
  "collection_key": null,
  "seo": { "title": "Sicherheit und Service", "description": "..." },
  "hero": { "h1": "SICHERHEIT UND SERVICE" },
  "sections": [ ... ],
  "published_at": "2026-03-06T12:00:00"
}
```

Wenn die Seite eine `collection_key` hat, wird die zugehoerige Collection automatisch mitgeliefert:
```json
{
  "id": 10,
  "slug": "busreisen",
  "collection_key": "reise-themen",
  "collection": {
    "items": [ ... ],
    "total": 7
  }
}
```

### Seitenbaum

```
GET /content/tree
```

Liefert alle veroeffentlichten Seiten als verschachtelte Baumstruktur.

### Globals abrufen

```
GET /content/globals/{slug}
```

**Beispiele:**
```
GET /content/globals/site-settings
GET /content/globals/navigation
GET /content/globals/service-page-settings
GET /content/globals/blog-page-settings
```

**Antwort:**
```json
{
  "slug": "site-settings",
  "label": "Site Settings",
  "data": {
    "site_name": "i+r Tours GmbH",
    "contact_phone": "+49 89 130 10 16 0",
    "contact_email": "info@ir-tours.de"
  }
}
```

### Collections abrufen

```
GET /content/collection/{key}
```

**Beispiele:**
```
GET /content/collection/reise-themen
GET /content/collection/continent-pages
GET /content/collection/team-members
GET /content/collection/megamenu-bilder
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
        "description": "Komfortable Busreisen...",
        "imageFallback": "/images/contao/busreisen-7a8fc5cf.jpg"
      },
      "sort_order": 0
    }
  ],
  "total": 7
}
```

### Zusammenfassung

| Endpunkt | Liefert |
|---|---|
| `/content/page?slug=X` | Einzelne Seite mit Sections |
| `/content/page?path=/X` | Einzelne Seite ueber URL-Pfad |
| `/content/tree` | Seitenbaum (Navigation) |
| `/content/globals/{slug}` | Global-Daten (Settings, Page-Config) |
| `/content/collection/{key}` | Collection-Eintraege (Listen) |
