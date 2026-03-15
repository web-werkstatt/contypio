---
title: "Import / Export"
icon: "arrow-left-right"
description: "Daten importieren und als Backup exportieren"
section: "Import & Export"
tags: [import, export, backup, json, migration]
order: 30
---

## Export (Backup)

Der Export erstellt eine JSON-Datei mit allen CMS-Daten.

### Ueber die API

```
GET /api/export/full
```

Liefert eine `cms-export-v1` JSON-Datei mit:
- Alle Globals
- Alle Pages (mit Sections, Hero, SEO)
- Alle Collections (mit Schema und Items)

### Im CMS-Admin

1. **Import/Export** im Seitenmenue klicken
2. Provider "JSON Datei" waehlen
3. Export-Tab: **Vollstaendiger Export**

## Import

### Im CMS-Admin (Import Wizard)

1. **Import/Export** im Seitenmenue klicken
2. Provider "JSON Datei" waehlen
3. JSON-Daten einfuegen oder Datei hochladen
4. **Verbindung testen**
5. **Entdecken** - zeigt was importiert werden kann
6. Auswahl treffen (Globals, Pages, Collections)
7. **Konflikt-Strategie** waehlen:
   - **Ueberspringen** - vorhandene Daten behalten
   - **Ueberschreiben** - vorhandene Daten ersetzen
8. **Import starten**

### Ueber die API

```
POST /api/import/execute
Content-Type: application/json

{
  "provider": "json",
  "config": { "data": { ... } },
  "mapping": {
    "globals": ["site-settings", "navigation"],
    "collections": ["reise-themen"],
    "import_pages": true,
    "conflict": "overwrite"
  }
}
```

## JSON Export-Format

```json
{
  "format": "cms-export-v1",
  "globals": {
    "site-settings": {
      "label": "Site Settings",
      "data": { "site_name": "i+r Tours" }
    }
  },
  "pages": [
    {
      "title": "Kontakt",
      "slug": "kontakt",
      "path": "/kontakt",
      "page_type": "content",
      "seo": { ... },
      "hero": { ... },
      "sections": [ ... ]
    }
  ],
  "collections": {
    "reise-themen": {
      "label": "Reisethemen",
      "schema": { "fields": [ ... ] },
      "items": [ ... ]
    }
  }
}
```
