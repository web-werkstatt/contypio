---
title: "Für Entwickler"
icon: "code-slash"
description: "Tech-Stack, Self-Hosting, Docker-Setup, Erweiterung"
section: "Contypio verstehen"
tags: [entwickler, docker, self-hosting, tech-stack, setup, api, python, react]
order: 5
tips:
  - "Self-Hosting erfordert Docker und Docker Compose"
  - "Die API-Dokumentation ist unter /docs (Swagger UI) erreichbar"
  - "Alle Delivery-Endpoints funktionieren ohne Authentifizierung"
---

## Tech-Stack

| Schicht | Technologie | Version |
|---|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic | Python 3.11, FastAPI 0.115 |
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui | React 18 |
| Datenbank | PostgreSQL | 18 |
| Cache | Redis | 7 |
| Auth | JWT (JSON Web Tokens) | — |
| Containerisierung | Docker, Docker Compose | — |

## Self-Hosting mit Docker

### Voraussetzungen
- Docker und Docker Compose installiert
- Mind. 2 GB RAM, 2 CPU-Kerne
- PostgreSQL-Datenbank (oder als Container)

### Container-Übersicht

Eine typische Installation besteht aus diesen Containern:

| Container | Port | Aufgabe |
|---|---|---|
| `contypio-api` | 8060 | FastAPI Backend + Delivery API |
| `contypio-admin` | 8086 | React Admin UI (Nginx) |
| `contypio-postgres` | 5432 | PostgreSQL Datenbank |
| `contypio-redis` | 6379 | Redis Cache |
| `contypio-hilfe` | 5001 | Hilfe-Center (Flask) |

### Umgebungsvariablen

Das Backend wird über Umgebungsvariablen konfiguriert:

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung | `postgresql+asyncpg://user:pass@postgres/db` |
| `REDIS_URL` | Redis-Verbindung | `redis://redis:6379/0` |
| `SECRET_KEY` | JWT-Signing-Key | (zufällig generieren) |
| `CORS_ORIGINS` | Erlaubte Origins | `["https://cms.example.com"]` |
| `DEFAULT_ADMIN_EMAIL` | Erster Admin-Account | `admin@example.com` |
| `DEFAULT_ADMIN_PASSWORD` | Initiales Passwort | (sicher wählen, danach ändern) |
| `DEFAULT_TENANT_SLUG` | Standard-Tenant | `main` |
| `UPLOAD_DIR` | Verzeichnis für Uploads | `/app/static/uploads` |

### Erster Start

Beim ersten Start:
1. Datenbank-Tabellen werden automatisch erstellt (SQLAlchemy `create_all`)
2. Standard-Tenant wird angelegt
3. Admin-Nutzer wird erstellt
4. Standard-Collections und Globals werden geseeded

Der Health-Check ist unter `GET /health` erreichbar.

## API-Struktur

### Delivery API (öffentlich)

Für Frontend-Anbindung — kein Auth nötig:

```
GET /content/page?slug=...     # Einzelne Seite
GET /content/page?path=...     # Seite über Pfad
GET /content/tree              # Seitenbaum
GET /content/globals/{slug}    # Global-Daten
GET /content/collection/{key}  # Collection-Einträge
```

### Admin API (JWT Auth)

Für Content-Management — Bearer Token erforderlich:

```
POST /api/auth/login           # Login → JWT Token
GET  /api/pages                # Seiten auflisten
POST /api/pages                # Seite erstellen
POST /api/media/upload         # Datei hochladen
GET  /api/collections          # Collections auflisten
PUT  /api/globals/{slug}       # Global aktualisieren
```

Vollständige Endpoint-Liste: siehe Topic „API-Übersicht".

## Frontend-Anbindung

### Beispiel: Astro

```typescript
// Seite abrufen
const res = await fetch('https://cms.example.com/content/page?slug=home');
const page = await res.json();

// Navigation abrufen
const treeRes = await fetch('https://cms.example.com/content/tree');
const tree = await treeRes.json();

// Global abrufen
const settingsRes = await fetch('https://cms.example.com/content/globals/site-settings');
const settings = await settingsRes.json();
```

### Beispiel: Next.js / Nuxt

Das gleiche Prinzip — `fetch()` gegen die Delivery API. Die Antwort ist immer JSON. Kein SDK nötig, kein Client-Paket erforderlich.

## Erweiterbarkeit

### Import-Adapter
Contypio hat ein Importer-Registry-System. Bestehende Adapter: Contao, WordPress (JSON). Neue Adapter können als Python-Module registriert werden.

### Collections & Schemas
Über den Schema Builder oder die Admin API können eigene Content-Typen erstellt werden. Feldtypen: Text, Rich Text, Number, Toggle, Date, Image, Select, Relation.

### Webhooks
Bei Änderungen an Seiten, Collections oder Globals können Webhooks ausgelöst werden (z.B. für Astro-Rebuild oder externe Systeme).
