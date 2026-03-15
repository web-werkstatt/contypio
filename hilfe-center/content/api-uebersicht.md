---
title: "API-Übersicht"
icon: "braces"
description: "Delivery API und Admin API — alle Endpoints"
section: "Contypio verstehen"
tags: [api, endpoints, delivery, admin, rest, json]
order: 3
tips:
  - "Delivery-Endpoints sind öffentlich — kein Login nötig"
  - "Admin-Endpoints erfordern einen JWT-Token (Bearer Auth)"
  - "API-Dokumentation ist unter /docs (Swagger UI) verfügbar"
---

## Zwei APIs

Contypio hat zwei getrennte API-Bereiche:

| API | Präfix | Auth | Zweck |
|---|---|---|---|
| **Delivery API** | `/content/...` | Keine | Veröffentlichte Inhalte abrufen |
| **Admin API** | `/api/...` | JWT Bearer | Inhalte verwalten, Nutzer, Medien |

## Delivery API (öffentlich)

Diese Endpoints liefern veröffentlichte Inhalte als JSON. Kein Login erforderlich.

### Seiten

```
GET /content/page?slug=service
GET /content/page?path=/service
```

Antwort enthält: Titel, Slug, Pfad, Seitentyp, SEO-Daten, Hero, Sections mit aufgelösten Medien-URLs. Bei Collection-Seiten wird die zugehörige Collection automatisch mitgeliefert.

### Seitenbaum

```
GET /content/tree
```

Liefert alle veröffentlichten Seiten als verschachtelte Baumstruktur (für Navigation).

### Globals

```
GET /content/globals/{slug}
```

Beispiele: `site-settings`, `navigation`, `footer`, `blog-page-settings`

### Collections

```
GET /content/collection/{key}
```

Beispiele: `team-members`, `reise-themen`, `continent-pages`

### Preview (Auth erforderlich)

```
GET /api/preview/{page_id}
POST /api/preview/{page_id}/resolve
```

Vorschau für unveröffentlichte Seiten. Erfordert gültigen JWT-Token.

### Cache

```
POST /api/cache/clear
```

Leert den In-Memory-Cache. Auth erforderlich.

---

## Admin API (authentifiziert)

Alle Admin-Endpoints erfordern einen gültigen JWT-Token im `Authorization`-Header:

```
Authorization: Bearer <token>
```

### Authentifizierung

| Method | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/auth/login` | Login (E-Mail + Passwort), gibt JWT zurück |
| GET | `/api/auth/me` | Aktuellen Nutzer abrufen |
| PATCH | `/api/auth/me` | Nutzerprofil bearbeiten |
| POST | `/api/auth/me/password` | Passwort ändern |
| POST | `/api/auth/register` | Neuen Nutzer anlegen (nur Admin) |

### Seiten verwalten

| Method | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/pages` | Seiten auflisten (flach oder Baum) |
| POST | `/api/pages` | Neue Seite erstellen |
| GET | `/api/pages/{id}` | Einzelne Seite abrufen |
| PUT | `/api/pages/{id}` | Seite aktualisieren |
| DELETE | `/api/pages/{id}` | Seite löschen |
| POST | `/api/pages/{id}/publish` | Seite veröffentlichen |
| POST | `/api/pages/{id}/unpublish` | Veröffentlichung zurücknehmen |
| PUT | `/api/pages/reorder` | Seitenreihenfolge ändern |

### Medien

| Method | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/media/upload` | Datei hochladen |
| GET | `/api/media` | Medien auflisten (Pagination, Filter, Suche) |
| GET | `/api/media/{id}` | Medium abrufen |
| PATCH | `/api/media/{id}` | Alt-Text oder Kategorie ändern |
| GET | `/api/media/{id}/usage` | Seiten finden, die dieses Medium nutzen |
| DELETE | `/api/media/{id}` | Medium löschen |

### Collections

| Method | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/collections` | Collection-Schemas auflisten |
| POST | `/api/collections` | Neues Schema erstellen |
| PUT | `/api/collections/{key}` | Schema bearbeiten |
| DELETE | `/api/collections/{key}` | Schema löschen |
| GET | `/api/collections/{key}/schema` | Schema-Details abrufen |
| GET | `/api/collections/{key}/items` | Einträge auflisten |
| GET | `/api/collections/{key}/items/{id}` | Einzelnen Eintrag abrufen |
| POST | `/api/collections/{key}/items` | Neuen Eintrag erstellen |
| PUT | `/api/collections/{key}/items/{id}` | Eintrag bearbeiten |
| DELETE | `/api/collections/{key}/items/{id}` | Eintrag löschen |

### Globals

| Method | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/globals` | Alle Globals auflisten |
| GET | `/api/globals/{slug}` | Global abrufen |
| PUT | `/api/globals/{slug}` | Global-Daten aktualisieren |

### Weitere Endpoints

| Method | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/block-types` | Verfügbare Block-Typen abrufen |
| GET | `/api/field-types` | Feld-Typ-Presets abrufen |
| POST | `/api/autofill` | KI-gestützte Inhaltsvorschläge |
| GET | `/api/tenants` | Tenant-Verwaltung |
| GET | `/api/page-versions/{id}` | Seitenversionen abrufen |
| GET | `/api/billing` | Abrechnungsdaten |
| GET | `/api/pricing` | Preisinformationen |
| POST | `/api/import` | Daten importieren |
| GET | `/api/export` | Daten exportieren |

---

## Swagger-Dokumentation

Die vollständige API-Dokumentation mit Request/Response-Schemas ist unter `/docs` verfügbar (Swagger UI). Dort können Endpoints auch direkt getestet werden.
