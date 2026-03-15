---
title: "Collections verwalten"
icon: "collection"
description: "Listen von Eintraegen mit einheitlichem Schema"
section: "CMS bedienen"
tags: [collections, listen, schema, eintraege, items]
order: 22
---

## Was sind Collections?

Collections sind Listen gleichartiger Eintraege, z.B. "Reisethemen" mit 7 Eintraegen (Busreisen, Flugreisen, ...).

Jede Collection hat ein **Schema** (Felddefinitionen) und **Items** (die eigentlichen Eintraege).

## Collection-Schema erstellen

1. Im CMS unter **Collections** auf "Neues Schema"
2. **Key** vergeben (z.B. `meine-liste`)
3. **Label** und **Label Singular** definieren
4. **Icon** waehlen
5. **Felder** definieren (Name, Typ, Label)

## Eintraege verwalten

In der Collection-Ansicht:
- **Neuer Eintrag** - Formular ausfuellen basierend auf Schema
- **Bearbeiten** - Eintrag anklicken
- **Sortieren** - Per Drag & Drop die Reihenfolge aendern
- **Loeschen** - Eintrag entfernen

## Eintrags-Felder

Jeder Eintrag hat:

| Feld | Beschreibung |
|---|---|
| `title` | Anzeigename |
| `slug` | URL-tauglicher Name |
| `data` | JSON-Objekt mit den Schema-Feldern |
| `status` | "draft" oder "published" |
| `sort_order` | Reihenfolge |

## Collections in Astro

Siehe [Collections in Astro verwenden](astro-collections) fuer Code-Beispiele.
