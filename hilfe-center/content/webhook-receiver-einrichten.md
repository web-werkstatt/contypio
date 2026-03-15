---
title: "Webhook-Empfaenger einrichten"
icon: "gear"
description: "Webhook-Receiver auf einem Server mit Caddy und Docker aufsetzen"
section: "Integrationen"
tags: [webhook, receiver, caddy, docker, systemd, astro, rebuild, einrichtung, server]
order: 51
tips:
  - "Der Receiver laeuft auf dem Docker-Host, nicht in einem Container - er muss Docker-Befehle ausfuehren koennen."
  - "Bei Caddy mit Bind-Mount: Datei in-place aendern (nicht sed -i), sonst zeigt der Mount die alte Datei."
  - "Debouncing verhindert, dass bei 10 schnellen Aenderungen 10 Rebuilds laufen."
---

## Ueberblick

Damit das CMS automatisch einen Astro-Rebuild ausloesen kann, braucht es einen **Webhook-Empfaenger** auf dem Server. Dieser nimmt HTTP-Requests vom CMS entgegen, prueft die HMAC-Signatur und startet den Build.

**Architektur:**

```
CMS Container ──HTTP POST──→ Caddy ──→ Webhook Receiver ──→ rebuild-astro.sh
(irtours-cms)                (Proxy)    (systemd, Port 9090)   (Astro Build)
```

## Schritt 1: Webhook-Receiver installieren

Der Receiver ist ein Python-Script, das auf dem **Docker-Host** laeuft (nicht in einem Container), weil es Docker-Befehle und Shell-Scripts ausfuehren muss.

**Dateien auf den Server kopieren:**

```bash
scp infrastructure/deploy/webhook-receiver.py irtours-docker:/opt/ir-tours/
scp infrastructure/deploy/rebuild-astro.sh irtours-docker:/opt/ir-tours/
ssh irtours-docker "chmod +x /opt/ir-tours/rebuild-astro.sh"
```

## Schritt 2: systemd-Service erstellen

```bash
ssh irtours-docker 'cat > /etc/systemd/system/webhook-receiver.service << EOF
[Unit]
Description=Webhook Receiver (Astro Rebuild)
After=network.target docker.service

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/ir-tours/webhook-receiver.py
WorkingDirectory=/opt/ir-tours
Environment=WEBHOOK_SECRET=dein-secret-hier
Environment=WEBHOOK_PORT=9090
Environment=REBUILD_SCRIPT=/opt/ir-tours/rebuild-astro.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'
```

**Service aktivieren und starten:**

```bash
ssh irtours-docker "systemctl daemon-reload"
ssh irtours-docker "systemctl enable webhook-receiver"
ssh irtours-docker "systemctl start webhook-receiver"
```

**Status pruefen:**

```bash
ssh irtours-docker "systemctl status webhook-receiver"
ssh irtours-docker "journalctl -u webhook-receiver -n 20"
```

## Schritt 3: Caddy-Route einrichten

Der CMS-Container kann `localhost` des Hosts nicht direkt erreichen. Caddy leitet den Webhook-Pfad an den Receiver weiter.

**Docker-Gateway-IP ermitteln:**

```bash
ssh irtours-docker "docker network inspect ir-tours_ir-tours-network \
  --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}'"
# Ergebnis z.B.: 172.18.0.1
```

**Caddyfile bearbeiten:**

Die Webhook-Route muss **vor** dem allgemeinen `handle`-Block stehen, da Caddy die erste passende Route verwendet:

```
cms.ir-tours.de {
    # Webhook Receiver (Astro Rebuild)
    handle /webhook/* {
        reverse_proxy 172.18.0.1:9090
    }

    # Hilfe-Center
    handle_path /hilfe* {
        reverse_proxy irtours-cms-hilfe:5001
    }

    # CMS Admin + API (alles andere)
    handle {
        reverse_proxy irtours-cms-admin:80
    }

    encode gzip

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        -Server
    }
}
```

**Wichtig bei Caddy mit Bind-Mount:**

Caddy liest die Caddyfile ueber einen Docker Bind-Mount. `sed -i` erstellt eine neue Datei (neuer Inode), aber der Mount zeigt weiterhin auf den alten Inode.

```bash
# FALSCH - Mount zeigt auf alte Datei:
sed -i 's/alt/neu/' /opt/ir-tours/caddy/Caddyfile

# RICHTIG - In-place schreiben (gleicher Inode):
python3 -c "
content = open('/opt/ir-tours/caddy/Caddyfile').read()
content = content.replace('alt', 'neu')
open('/opt/ir-tours/caddy/Caddyfile', 'w').write(content)
"

# Danach Container neustarten (nicht nur reload):
docker restart caddy
```

## Schritt 4: Webhook im CMS erstellen

1. CMS oeffnen → **System → Webhooks**
2. **"Webhook erstellen"** klicken
3. Konfiguration:
   - **Name:** `Astro Rebuild`
   - **URL:** `http://172.18.0.1:9090/webhook/rebuild`
   - **Events:** `page.published`, `page.unpublished`, `page.deleted`, `global.updated`
4. **Secret kopieren** und im systemd-Service unter `WEBHOOK_SECRET` eintragen
5. Service neustarten: `systemctl restart webhook-receiver`
6. **Test-Button** klicken - sollte "Erfolgreich (HTTP 200)" zeigen

**Warum interne IP statt Domain?**

Der CMS-Container laeuft im Docker-Netzwerk und kann `cms.ir-tours.de` nicht aufloesen (das zeigt auf den Server selbst). Stattdessen wird die Docker-Gateway-IP (`172.18.0.1`) verwendet, die den Host direkt erreicht.

## Schritt 5: Rebuild-Script anpassen

Das Script `/opt/ir-tours/rebuild-astro.sh` fuehrt den eigentlichen Build aus. Es muss an die eigene Infrastruktur angepasst werden:

```bash
#!/bin/bash
set -euo pipefail

# Astro im Builder-Container bauen
docker exec irtours-astro-builder sh -c "cd /app && npm run build"

# Output synchronisieren
rsync -a --delete /opt/ir-tours/astro-src/dist/client/ /opt/ir-tours/preview-dist/
rsync -a --delete /opt/ir-tours/astro-src/dist/client/ /opt/ir-tours/astro-dist/
```

## Testen

**Health-Check des Receivers:**

```bash
ssh irtours-docker "curl -s http://localhost:9090/health"
# {"status": "ok", "last_rebuild": 0.0}
```

**Manueller Webhook mit gueltigem HMAC:**

```bash
SECRET="dein-secret"
BODY='{"event":"test.ping","timestamp":"2026-01-01T00:00:00Z","data":{}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://cms.ir-tours.de/webhook/rebuild \
  -H "Content-Type: application/json" \
  -H "X-CMS-Signature: sha256=$SIG" \
  -d "$BODY"
```

**Logs pruefen:**

```bash
ssh irtours-docker "journalctl -u webhook-receiver -f"
```

## Fehlerbehebung

| Problem | Ursache | Loesung |
|---------|---------|---------|
| Test-Button zeigt "Connection failed" | CMS kann Receiver nicht erreichen | URL auf interne IP pruefen (`172.18.0.1:9090`) |
| 403 Invalid Signature | Secret stimmt nicht ueberein | Secret im CMS und im systemd-Service vergleichen |
| Caddy Error "parsed as site address" | Caddyfile-Syntax falsch | Einrueckung pruefen, `handle` muss in einem Site-Block stehen |
| Rebuild laeuft nicht | Script nicht ausfuehrbar | `chmod +x rebuild-astro.sh` |
| Mount zeigt alte Caddyfile | `sed -i` erstellt neuen Inode | Datei in-place schreiben, dann `docker restart caddy` |
