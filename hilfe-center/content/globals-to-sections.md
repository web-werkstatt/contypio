---
title: "Globals zu Sections"
icon: "arrow-down-up"
description: "Automatische Konvertierung von Globals in sichtbare Seiteninhalte"
section: "Import & Export"
tags: [globals, sections, konvertierung, sync, automatisch]
order: 31
---

## Problem

Globals enthalten strukturierte Daten (z.B. AGB-Paragraphen, Kontaktdaten), aber diese sind im CMS nicht als Seiteninhalt sichtbar. Wenn man eine Seite oeffnet, sieht man leere Sections.

## Loesung: Sync-Globals

Der Endpunkt `/api/pages/sync-globals` konvertiert automatisch:

1. **Content-Globals** (AGB, Datenschutz, Impressum, Kontakt, Service) werden in richText-Sections umgewandelt
2. **Portal-Seiten** ohne Sections bekommen Sections aus ihren Hero-Daten generiert

### API-Aufruf

```
POST /api/pages/sync-globals
Authorization: Bearer {token}
```

**Antwort:**
```json
{
  "synced": [
    { "page": "agb", "sections": 20, "source": "global:agb-page-settings" },
    { "page": "kontakt", "sections": 8, "source": "global:kontakt-page-settings" },
    { "page": "busreisen", "sections": 3, "source": "hero" }
  ],
  "skipped": [],
  "errors": []
}
```

### Was wird konvertiert?

| Seite | Global | Sections | Blocks |
|---|---|---|---|
| agb | agb-page-settings | 1 | 20 (Intro + 18 Paragraphen + Footer) |
| datenschutz | datenschutz-page-settings | 1 | 10 |
| impressum | impressum-page-settings | 1 | 9 |
| kontakt | kontakt-page-settings | 1 | 8 |
| service | service-page-settings | 1 | 8 |
| Portal-Seiten | (aus Hero-Daten) | 1 | 3 (Hero + Listing + Featured) |

Alle Blocks einer Seite werden in **einer Section** gruppiert. So bleibt der Section Editor uebersichtlich - eine Section mit vielen Blocks statt vielen Sections mit je einem Block.

Nach dem Sync sind die Inhalte direkt im Section Editor sichtbar und bearbeitbar.
