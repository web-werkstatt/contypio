---
title: "Architektur-Ueberblick"
icon: "diagram-3"
description: "Wie CMS, Delivery API und Astro zusammenspielen"
section: "Architektur & Grundlagen"
tags: [architektur, api, astro, cms, ueberblick]
order: 1
tips:
  - "Die Delivery API ist oeffentlich - kein Login noetig"
  - "Astro holt Daten zur Build-Zeit (SSG) vom CMS"
  - "Aenderungen im CMS werden erst nach Astro-Rebuild sichtbar"
---

## Das Gesamtbild

Das System besteht aus drei Teilen:

| Komponente | URL | Aufgabe |
|---|---|---|
| **CMS Admin** | cms.ir-tours.de | Inhalte bearbeiten (Pages, Globals, Collections) |
| **Delivery API** | cms.ir-tours.de/content/... | Inhalte als JSON ausliefern |
| **Astro Website** | ir-tours.de / preview.ir-tours.de | Fertige Webseite fuer Besucher |

### Datenfluss

```
CMS Admin (Redakteur bearbeitet Seite)
    ↓ speichert in PostgreSQL
Delivery API (/content/page, /content/globals/..., /content/collection/...)
    ↓ Astro fetch() zur Build-Zeit
Astro Website (statisches HTML fuer Besucher)
```

### Drei Datentypen im CMS

1. **Pages** - Seiten mit Sections (Abschnitte mit Bloecken)
2. **Globals** - Einstellungen und strukturierte Daten (z.B. "service-page-settings")
3. **Collections** - Listen von Eintraegen (z.B. "reise-themen", "continent-pages")

### Wer liefert was?

| Datenquelle | Beispiel-Daten |
|---|---|
| **Python CMS** (Delivery API) | Navigation, Seiteninhalte, SEO, Team, Settings |
| **FastAPI** (api.ir-tours.de) | Reisedaten (435 Reisen), Kontinente, Laender |
| **Ghost Blog** (blog.ir-tours.de) | Blog-Artikel, Tags, Autoren |

Astro kombiniert diese drei Quellen zu einer einzigen Webseite.
