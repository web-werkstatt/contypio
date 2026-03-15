---
title: "Globals verwalten"
icon: "globe2"
description: "Globale Einstellungen und seitenspezifische Konfigurationen"
section: "CMS bedienen"
tags: [globals, einstellungen, settings, bearbeiten]
order: 21
---

## Was sind Globals?

Globals sind benannte JSON-Datensaetze fuer seituebergreifende oder seitenspezifische Einstellungen.
Im Gegensatz zu Seiten haben sie keine Sections - nur freie JSON-Daten.

## Global erstellen

1. Im CMS unter **Globals** auf "Neu"
2. **Slug** vergeben (z.B. `meine-seite-settings`)
3. **Label** vergeben (z.B. "Meine Seite Settings")
4. **Daten** als JSON eingeben
5. Speichern

## Global bearbeiten

Der JSON-Editor zeigt die Daten an. Felder koennen direkt bearbeitet werden.

## Typische Strukturen

### Seiten-Settings (Hero + SEO + Inhalt)

```json
{
  "heroGroup": {
    "title": "MEIN TITEL",
    "subtitle": "Untertitel"
  },
  "introText": "Einleitungstext...",
  "seoGroup": {
    "seoTitle": "Mein Titel - i+r Tours",
    "seoDescription": "Beschreibung fuer Google..."
  }
}
```

### Site-Settings

```json
{
  "site_name": "i+r Tours GmbH",
  "contact_phone": "+49 89 130 10 16 0",
  "contact_email": "info@ir-tours.de"
}
```

## Globals in Astro

Siehe [Globals in Astro verwenden](astro-globals) fuer Code-Beispiele.
