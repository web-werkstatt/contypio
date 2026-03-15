---
title: "Seiten erstellen"
icon: "file-earmark-plus"
description: "Neue CMS-Seite anlegen und mit Astro verbinden"
section: "CMS bedienen"
tags: [seite, erstellen, page, sections, editor]
order: 20
tips:
  - "Slug und Path muessen eindeutig sein"
  - "Status auf 'published' setzen damit die Delivery API die Seite ausliefert"
  - "collection_key nur setzen wenn die Seite eine Collection anzeigen soll"
---

## Neue Seite im CMS

1. Im CMS-Admin auf **Seiten** klicken
2. **Neue Seite** Button klicken
3. Felder ausfuellen:

| Feld | Beispiel | Pflicht |
|---|---|---|
| Titel | "Busreisen" | Ja |
| Slug | "busreisen" | Ja |
| Pfad | "/busreisen" | Ja |
| Seitentyp | "portal" | Ja |
| Status | "published" | Ja |
| Collection Key | "reise-themen" | Optional |

4. **Speichern**

## Seitentypen

| Typ | Verwendung |
|---|---|
| `content` | Statische Inhaltsseite (AGB, Kontakt, Service) |
| `portal` | Portal/Listing mit Collection-Link (Busreisen, Europa) |
| `listing` | Auflistungsseite mit Filter |

## SEO und Hero

Nach dem Erstellen koennen SEO und Hero bearbeitet werden:

- **SEO:** Title-Tag und Meta-Description
- **Hero:** Ueberschrift (h1), Untertitel, Hintergrundbild

## Sections bearbeiten

Im **Section Editor** koennen Abschnitte hinzugefuegt werden.
Jede Section hat ein Layout und enthaelt Spalten mit Bloecken.

Verfuegbare Block-Typen:
- **richText** - Ueberschrift + HTML-Text
- **image** - Einzelnes Bild
- **gallery** - Bildergalerie
- **tripListing** - Reiseliste mit Filter
- **featuredTrips** - Ausgewaehlte Reisen

## Seite in Astro abrufen

Nach dem Veroeffentlichen ist die Seite sofort ueber die API verfuegbar:

```
GET /content/page?slug=busreisen
```
