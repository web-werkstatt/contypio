---
title: "Editionen und Limits"
icon: "layers"
description: "Editions-Matrix, Features und Ressourcen-Limits pro Plan"
section: "Contypio verstehen"
tags: [editionen, limits, pricing, light, starter, pro, agency, features]
order: 4
tips:
  - "Die Light-Edition ist kostenlos und Open Source (Self-hosted)"
  - "Cloud-Editionen werden über Stripe-Subscriptions verwaltet"
  - "Feature-Gates werden serverseitig geprüft — kein Umgehen möglich"
---

## Vier Editionen

| Edition | Hosting | Lizenz | Zielgruppe |
|---|---|---|---|
| **Light** | Self-hosted | Open Source (kostenlos) | Entwickler, kleine Projekte |
| **Starter** | Contypio Cloud | SaaS (Stripe) | Kleine Teams |
| **Pro** | Contypio Cloud | SaaS (Stripe) | Professionelle Teams |
| **Agency** | Contypio Cloud | SaaS (Stripe) | Agenturen mit mehreren Kunden |

## Ressourcen-Limits

| Ressource | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Seiten | 50 | 200 | 1.000 | unbegrenzt |
| Medien-Speicher | 500 MB | 2 GB | 10 GB | unbegrenzt |
| Nutzer | 3 | 3 | 10 | 25 |
| Spaces | 1 | 3 | 10 | 30+ |
| Sites | 1 | 3 | 10 | 30+ |

## Feature-Matrix

### Content & Schema

| Feature | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Schema Builder | Ja | Ja | Ja | Ja |
| Webhooks | Ja | Ja | Ja | Ja |
| Webhook Retry & Logs | — | — | Ja | Ja |
| API Keys | — | — | Ja | Ja |

### Nutzer & Rollen

| Feature | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Rollen | Admin/Editor | Simple Rollen | Custom Rollen | Custom Rollen + Mandanten-Isolation |
| Multi-Tenant | — | — | — | Ja |
| SSO/OIDC | — | — | — | Ja |

### Branding

| Feature | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Contypio-Branding | sichtbar | eigenes Logo | White-Label | White-Label + Agentur-Branding |
| Branding entfernen | — | — | Ja | Ja |

### Backup & Preview

| Feature | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Backups | Manuell (Export) | Tägliche Backups | + 7-Tage-Restore | Mehrere Snapshots + 30-Tage-Restore |
| Staging/Preview | Lokale Preview | Vorschau-URLs | Staging-Environment | Mehrere Environments (dev/stage/prod) |

### Analytics & Support

| Feature | Light | Starter | Pro | Agency |
|---|---|---|---|---|
| Analytics | — | Basis-Usage | Content-Statistiken | Erweiterte Analytics + Kunden-Reports |
| Automatische Backups | — | Ja | Ja | Ja |
| Support | Community / GitHub | E-Mail (best effort) | E-Mail mit SLAs | Priorisiert (Slack/Teams) |

## Technische Umsetzung

### Edition-Gate

Das Edition-Gate (`edition_gate.py`) prüft bei jeder Aktion serverseitig, ob der aktuelle Tenant die nötigen Berechtigungen hat:

- **Ressourcen-Limits:** Beim Erstellen von Seiten, Hochladen von Medien oder Anlegen von Nutzern wird geprüft, ob das Limit der Edition erreicht ist
- **Feature-Flags:** Beim Zugriff auf geschützte Features (z.B. Custom Roles, API Keys) wird geprüft, ob die Edition das Feature enthält

Bei Überschreitung wird ein HTTP 403 mit Hinweis auf die benötigte Edition zurückgegeben.

### Edition zuweisen

- **Light:** Standardwert, kein Lizenzschlüssel nötig
- **Cloud (Starter/Pro/Agency):** Wird automatisch über Stripe-Subscription gesetzt
- **Pro Self-hosted:** Signierter Lizenzschlüssel (JSON mit Edition, max_tenants, Ablaufdatum)

## Usage-Seite

Im Admin UI unter „Nutzung & Plan" wird der aktuelle Verbrauch angezeigt:
- Anzahl Seiten / Maximum
- Medien-Speicher / Maximum
- Anzahl Nutzer / Maximum
- Aktive Features der aktuellen Edition
