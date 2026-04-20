# Contypio – Support-Matrix für Astro Go-Live

**Stand:** 20.04.2026  
**Zweck:** verbindliche technische Zielmatrix für den Astro-Launch von Contypio

## 1. Support-Level

- **Supported:** aktiv unterstützt und für den Launch vorgesehen
- **Tested:** bereits im Projekt oder lokal nachweisbar / plausibel testbar
- **Planned:** geplant, aber noch nicht belastbar nachgewiesen

## 2. Laufzeit- und Tooling-Matrix

| Bereich | Version | Status | Kommentar |
|---|---|---|---|
| Node.js | `22.12.0+` | **Supported** | erforderlich für Astro 6 |
| Node.js lokal | `22.22.2` | **Tested** | lokale Umgebung erfüllt Astro-6-Anforderung |
| npm | `10.x` | **Supported** | lokal `10.9.7` |
| Python | `3.13.x` | **Supported** | empfohlene Zielversion für Contypio |
| Python | `3.14.x` | **Planned** | nach Kompatibilitätsprüfung sinnvoll |
| Python lokal | `3.11.2` | **Nicht Zielstand** | vor Launch an Zielversion angleichen |
| TypeScript | `5.9.x` | **Supported** | aktueller stabiler Repo-Stand |
| TypeScript | `6.0.x` | **Planned** | separat prüfen, kein Launch-Blocker |

## 3. Framework-Matrix

| Bereich | Version | Status | Kommentar |
|---|---|---|---|
| Astro | `6.1.x` | **Supported** | Zielplattform für Headless-CMS-Launch |
| Astro Starter | `6.1.x` | **Planned** | im Repo aktuell noch nicht real vorhanden |
| Next.js | `16.x` | **Reference only** | nicht Go-Live-Blocker, aber als Zielplattform in Doku relevant |
| React | `19.x` | **Supported** | bereits im Admin-Frontend eingesetzt |
| Vite | `8.x` | **Tested im Admin** | Astro 6 basiert auf Vite 7; Interop beobachten |

## 4. Contypio-Komponenten für Astro

| Komponente | Status | Kommentar |
|---|---|---|
| Delivery API | **Supported** | produktrelevant und im Code nachweisbar |
| TypeScript SDK (`@contypio/client`) | **Supported** | zentrale Astro-Integrationsschicht |
| i18n | **Supported** | im Backend implementiert |
| Batch / Cursor / Schema | **Supported** | wichtige Astro-/SSG-Bausteine vorhanden |
| API-Versionierung | **Planned** | vor größerem externen Launch nachziehen |
| Astro Starter | **Planned** | muss real gebaut werden |
| Astro Demo / Referenz | **Planned** | für Außenwirkung erforderlich |

## 5. Mindestanforderungen für „Astro Launch Ready“

Contypio gilt erst dann als Astro-launch-ready, wenn:

1. `starters/astro/` real existiert
2. Astro 6.1 lokal baut
3. SDK dort ohne Sonderpfade nutzbar ist
4. Homepage + dynamische Slug-Seiten + Globals funktionieren
5. Versionen und Supportgrenzen dokumentiert sind

## 6. Entscheidung

Für den Astro-Go-Live wird als offizieller Zielstack festgelegt:

- **Astro 6.1.x**
- **Node 22.12.0+**
- **Python 3.13.x**
- **TypeScript 5.9.x** für den initialen Launch

TypeScript 6.0 und Python 3.14 werden separat bewertet, aber nicht als unmittelbare Launch-Voraussetzung erzwungen.
