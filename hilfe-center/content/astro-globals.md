---
title: "Globals in Astro verwenden"
icon: "globe2"
description: "Wie man Globals (Settings, Page-Config) in Astro-Seiten einbindet"
section: "Astro-Anbindung"
tags: [globals, astro, settings, hero, seo, fetch]
order: 11
tips:
  - "json.data || json ist wichtig - Globals wrappen Daten in .data"
  - "Spread-Operator { ...defaults, ...data } merged CMS-Daten mit Defaults"
---

## Was sind Globals?

Globals sind benannte Datensaetze im CMS, z.B. `service-page-settings` oder `site-settings`.
Sie enthalten strukturierte JSON-Daten ohne eigene Seite.

## API-Aufruf

```
GET /content/globals/service-page-settings
```

**Antwort:**
```json
{
  "slug": "service-page-settings",
  "label": "Service Page Settings",
  "data": {
    "heroGroup": { "title": "SICHERHEIT UND SERVICE" },
    "introText": "Damit Ihre Reise...",
    "serviceCards": [ ... ],
    "seoGroup": { "seoTitle": "Service - i+r Tours" }
  }
}
```

## Code-Muster in Astro

```javascript
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';

// Defaults - IMMER definieren
const defaults = {
  heroGroup: { title: 'SERVICE' },
  introText: 'Fallback-Text...',
  seoGroup: { seoTitle: 'Service - i+r Tours' },
};

// CMS laden
let s = defaults;
try {
  const res = await fetch(`${CMS_URL}/content/globals/service-page-settings`);
  if (res.ok) {
    const json = await res.json();
    const data = json.data || json;  // WICHTIG: .data auspacken
    s = { ...defaults, ...data };
  }
} catch { /* Fallback */ }

// Felder mit Fallback
const hero = s.heroGroup || defaults.heroGroup;
const seo = s.seoGroup || defaults.seoGroup;
```

## Vorhandene Globals

| Global-Slug | Verwendet in | Daten |
|---|---|---|
| `site-settings` | BaseLayout, Footer | Firmenname, Telefon, Email |
| `navigation` | Header, MegaMenu | Menue-Struktur |
| `agb-page-settings` | agb.astro | AGB-Paragraphen, Hero, SEO |
| `datenschutz-page-settings` | datenschutz.astro | Datenschutz-Abschnitte |
| `impressum-page-settings` | impressum.astro | Anbieterdaten, Haftung |
| `kontakt-page-settings` | kontakt.astro | Kontaktdaten, Team, Formular |
| `service-page-settings` | service.astro | Service-Cards, CTA |
| `blog-page-settings` | neuigkeiten/index.astro | Blog-Hero, CTA, SEO |
| `reiseziele-uebersicht-settings` | alle-reiseziele.astro | Hero, SEO |
| `reisethemen-uebersicht-settings` | alle-reisethemen.astro | Hero, SEO |

## Neues Global im CMS anlegen

1. Im CMS unter **Globals** auf "Neu" klicken
2. **Slug** vergeben (z.B. `meine-seite-settings`)
3. **Label** vergeben (z.B. "Meine Seite Settings")
4. **Daten** als JSON eingeben
5. Speichern

Die Daten sind sofort ueber `/content/globals/meine-seite-settings` abrufbar.
