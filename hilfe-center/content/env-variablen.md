---
title: "ENV-Variablen"
icon: "gear"
description: "Alle relevanten Umgebungsvariablen fuer CMS und Astro"
section: "Deployment"
tags: [env, variablen, konfiguration, urls, environment]
order: 41
tips:
  - "PUBLIC_CMS_URL muss von Astro zur Build-Zeit erreichbar sein"
  - "Lokal: http://localhost:8060 | Production: https://cms.ir-tours.de"
---

## Astro ENV-Variablen

In `.env` (lokal) bzw. `.env.production`:

| Variable | Lokal | Production | Verwendung |
|---|---|---|---|
| `PUBLIC_CMS_URL` | `http://localhost:8060` | `https://cms.ir-tours.de` | CMS Delivery API |
| `PUBLIC_API_URL` | `http://localhost:8101` | `http://localhost:8101` | FastAPI (Reisedaten) |
| `PUBLIC_API_ASSET_URL` | `https://api.ir-tours.de` | `https://api.ir-tours.de` | Bild-URLs im Browser |
| `PUBLIC_GHOST_URL` | `https://blog.ir-tours.de` | `https://blog.ir-tours.de` | Ghost Blog |
| `PUBLIC_GHOST_KEY` | (Key) | (Key) | Ghost Content API Key |

### Wichtig: API_URL vs. CMS_URL

- **PUBLIC_API_URL** = FastAPI Backend (Reisedaten, 435 Reisen)
- **PUBLIC_CMS_URL** = Python CMS (Navigation, Pages, Globals, Collections)

Das sind zwei verschiedene Systeme!

### Wichtig: API_URL vs. API_ASSET_URL

- **PUBLIC_API_URL** = Fuer `fetch()` zur Build-Zeit (kann localhost sein)
- **PUBLIC_API_ASSET_URL** = Fuer Bild-URLs im HTML (muss Production-URL sein, da Browser localhost nicht erreicht)

## CMS Backend ENV

| Variable | Wert | Beschreibung |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL Verbindung |
| `DEFAULT_TENANT_SLUG` | `default` | Standard-Mandant |
| `API_ASSET_URL` | `https://cms.ir-tours.de` | Basis-URL fuer Media-URLs |
