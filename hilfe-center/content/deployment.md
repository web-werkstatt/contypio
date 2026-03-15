---
title: "Deployment"
icon: "cloud-upload"
description: "CMS und Astro auf Production deployen"
section: "Deployment"
tags: [deployment, production, deploy, server, proxmox]
order: 40
---

## CMS Backend deployen

```bash
# Code synchronisieren + Container neustarten
./infrastructure/deploy/deploy-proxmox.sh sync cms
```

Das Script synced den Python-Code nach `/opt/ir-tours/cms-app` und startet den Container `irtours-cms` neu.

## CMS Frontend deployen

```bash
# Im cms-python/frontend/ Ordner:
npm run build

# Build-Output auf Production kopieren:
rsync -avz dist/ irtours-docker:/opt/ir-tours/cms-admin-dist/
```

## Astro Website deployen

```bash
# Astro Build + Deploy (Production)
./infrastructure/deploy/deploy-proxmox.sh sync astro
```

Baut Astro mit Production-ENV, fuehrt Post-Build Validation aus, und deployed.

## Nach CMS-Aenderungen

Wenn ein Webhook eingerichtet ist, wird Astro **automatisch** neu gebaut wenn eine Seite publiziert wird. Siehe [Webhooks](/hilfe/topic/webhooks).

**Manueller Rebuild** (falls kein Webhook konfiguriert):

1. Inhalt im CMS bearbeiten und speichern
2. `./infrastructure/deploy/deploy-proxmox.sh sync astro` ausfuehren
3. Webseite pruefen

## Container-Status pruefen

```bash
ssh irtours-docker "docker ps | grep cms"
```

Erwartete Container:
- `irtours-cms` - FastAPI Backend (Port 8060)
- `irtours-cms-admin` - nginx Frontend + Proxy
