---
title: "Webhooks"
icon: "broadcast"
description: "Automatische Benachrichtigungen bei Inhaltsaenderungen - Astro-Rebuild, Suche, externe Systeme"
section: "Integrationen"
tags: [webhooks, automatisierung, rebuild, astro, events, hmac, benachrichtigung]
order: 50
tips:
  - "Webhooks sind fire-and-forget: Der Redakteur wartet nicht auf die Zustellung."
  - "Das Secret wird nur einmal nach der Erstellung angezeigt. Sofort kopieren!"
  - "Nutze den Test-Button um die Verbindung zu pruefen, bevor du Events aktivierst."
---

## Was sind Webhooks?

Webhooks sind automatische HTTP-Benachrichtigungen, die das CMS an externe Systeme sendet, wenn sich Inhalte aendern. Statt regelmaessig nachzufragen ob es Aenderungen gibt (Polling), informiert das CMS aktiv den Empfaenger.

**Typische Anwendungsfaelle:**

- **Astro-Rebuild**: Seite publiziert → Webseite wird automatisch neu gebaut
- **Suchindex**: Inhalt geaendert → Suchindex aktualisiert
- **Benachrichtigungen**: Neue Seite → Slack/Teams-Nachricht
- **CDN-Cache**: Inhalt aktualisiert → Cache invalidiert

## Events

Das CMS unterstuetzt folgende Event-Typen:

| Event | Beschreibung |
|-------|-------------|
| `page.created` | Neue Seite angelegt |
| `page.updated` | Seite bearbeitet |
| `page.published` | Seite veroeffentlicht |
| `page.unpublished` | Seite zurueckgezogen |
| `page.deleted` | Seite geloescht |
| `collection.item_created` | Neuer Collection-Eintrag |
| `collection.item_updated` | Collection-Eintrag bearbeitet |
| `collection.item_deleted` | Collection-Eintrag geloescht |
| `media.uploaded` | Datei hochgeladen |
| `media.deleted` | Datei geloescht |
| `global.updated` | Globale Einstellung geaendert |

## Webhook erstellen

1. Im CMS unter **System → Webhooks** die Seite oeffnen
2. **"Webhook erstellen"** klicken
3. **Name** eingeben (z.B. "Astro Rebuild")
4. **URL** eingeben (z.B. `http://172.18.0.1:9090/webhook/rebuild`)
5. **Events** auswaehlen (z.B. `page.published`, `global.updated`)
6. **Erstellen** klicken
7. **Secret kopieren** - wird nur einmalig angezeigt!

## Payload-Format

Jeder Webhook sendet einen HTTP POST mit JSON-Body:

```json
{
  "event": "page.published",
  "timestamp": "2026-03-09T14:30:00+00:00",
  "data": {
    "id": 42,
    "slug": "busreisen",
    "title": "Busreisen"
  }
}
```

## HMAC-Signatur

Jeder Webhook wird mit HMAC-SHA256 signiert. Der Empfaenger kann damit verifizieren, dass der Request tatsaechlich vom CMS kommt.

**Header:**

| Header | Beispiel |
|--------|---------|
| `X-CMS-Event` | `page.published` |
| `X-CMS-Signature` | `sha256=a1b2c3...` |
| `Content-Type` | `application/json` |

**Signatur pruefen (Python):**

```python
import hmac, hashlib

def verify(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(
        expected, signature.removeprefix("sha256=")
    )
```

**Signatur pruefen (Node.js):**

```javascript
const crypto = require('crypto');

function verify(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return `sha256=${expected}` === signature;
}
```

## Testen

Jeder Webhook hat einen **Test-Button**. Dieser sendet ein `test.ping` Event an die konfigurierte URL. Das Ergebnis (HTTP-Status, Dauer) wird sofort angezeigt.

## Logs

Unter jedem Webhook koennen die letzten Zustellungen eingesehen werden:

- **Event** - Welches Event ausgeloest wurde
- **Status** - HTTP-Statuscode (200 = Erfolg)
- **Dauer** - Antwortzeit in Millisekunden
- **Zeitpunkt** - Wann die Zustellung erfolgte

## Retry-Logik

| Edition | Verhalten |
|---------|-----------|
| Light / Starter | Einmaliger Zustellversuch |
| Pro / Agency | 3 Versuche mit Backoff (5s, 30s, 120s) |

## Debouncing

Der Webhook-Empfaenger sollte ein Debouncing implementieren, um bei schnellen Aenderungen nicht mehrfach zu bauen. Der mitgelieferte IR-Tours Receiver wartet 30 Sekunden nach dem letzten Event, bevor er den Rebuild startet.

## API-Endpoints

Webhooks koennen auch per API verwaltet werden:

```
GET    /api/webhooks              Alle Webhooks auflisten
POST   /api/webhooks              Webhook erstellen
GET    /api/webhooks/{id}         Webhook-Details
PUT    /api/webhooks/{id}         Webhook aktualisieren
DELETE /api/webhooks/{id}         Webhook loeschen
POST   /api/webhooks/{id}/test    Test-Event senden
GET    /api/webhooks/{id}/logs    Zustellungs-Logs
GET    /api/webhooks/events       Verfuegbare Event-Typen
```
