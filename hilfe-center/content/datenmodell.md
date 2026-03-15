---
title: "Datenmodell"
icon: "database"
description: "Pages, Globals, Collections - die drei Datentypen im CMS"
section: "Architektur & Grundlagen"
tags: [datenmodell, pages, globals, collections, sections]
order: 3
---

## Pages (Seiten)

Eine Seite hat diese Felder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `title` | Text | Seitentitel (z.B. "Kontakt") |
| `slug` | Text | URL-Name (z.B. "kontakt") |
| `path` | Text | Voller Pfad (z.B. "/kontakt") |
| `page_type` | Text | "content", "portal" oder "listing" |
| `collection_key` | Text | Verknuepfte Collection (z.B. "reise-themen") |
| `status` | Text | "draft" oder "published" |
| `seo` | JSON | `{ title, description }` |
| `hero` | JSON | `{ h1, subline, image, ... }` |
| `sections` | JSON | Array von Section-Objekten |

### Section-Struktur

```json
{
  "id": "section_1",
  "layout": "full",
  "background": { "color": "#ffffff" },
  "spacing": { "paddingTop": "48px", "paddingBottom": "48px" },
  "columns": [
    {
      "id": "col_1",
      "blocks": [
        {
          "id": "block_1",
          "blockType": "richText",
          "data": { "title": "Willkommen", "content": "Text hier..." }
        }
      ]
    }
  ]
}
```

## Globals

Globals speichern strukturierte Daten ohne eigene Seite:

| Global-Slug | Inhalt |
|---|---|
| `site-settings` | Firmenname, Telefon, Email |
| `navigation` | Hauptmenue-Struktur |
| `service-page-settings` | Hero, Cards, CTA fuer Service-Seite |
| `kontakt-page-settings` | Kontaktdaten, Team, Formular |
| `agb-page-settings` | AGB-Paragraphen |
| `blog-page-settings` | Blog-Hero, CTA, SEO |
| `reiseziele-uebersicht-settings` | Hero/SEO fuer Reiseziele |

## Collections

Collections sind Listen mit Schema:

| Collection-Key | Eintraege |
|---|---|
| `reise-themen` | Busreisen, Flugreisen, Wanderreisen, ... |
| `continent-pages` | Afrika, Europa, Asien, ... |
| `destination-pages` | Griechenland, Italien, Marokko, ... |
| `team-members` | Mitarbeiter mit Foto, Rolle, Kontakt |
| `megamenu-bilder` | Bilder fuer das Megamenue |
