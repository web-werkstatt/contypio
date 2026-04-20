# Contypio + Astro 6.1 – Compatibility Check

**Stand:** 20.04.2026  
**Zweck:** Abgleich des aktuellen Contypio-Repositories mit dem technischen Zielbild für Astro 6.1

## 1. Ausgangslage

Contypio ist bereits als Headless CMS für API-first-Frontends angelegt. Im Repository sind Delivery API, TypeScript-SDK und Astro-/Next.js-Beispiele in der SDK-Dokumentation erkennbar. Ein lauffähiger Astro-Starter ist im aktuellen Repo-Stand jedoch noch nicht nachweisbar.

## 2. Repo-Stand vs. Zielstack

| Bereich | Repo / lokal | Ziel / externer Stand | Bewertung |
|---|---|---|---|
| Astro | kein lauffähiges Astro-Projekt im Repo nachweisbar | Astro 6.1.x | **Gap** |
| Node.js | lokal `v22.22.2` | Astro 6 verlangt Node `22.12.0+` | **ok** |
| Python | lokal `3.11.2`; README zielt auf `3.13` | sinnvoll: Python `3.13.x` oder `3.14.x` | **teilweise ok** |
| TypeScript Frontend | `5.9.3` | aktuell ist TypeScript `6.0` verfügbar | **ok, aber nicht aktuell** |
| TypeScript SDK | `^5.5.0` | TypeScript `6.0` verfügbar | **ok, aber nicht aktuell** |
| Next.js | nicht im Produkt eingesetzt | aktuell ist Next.js `16` | **nur Referenz, kein Blocker** |
| React | `19.2.0` | kompatibel für moderne Astro-Integrationen | **ok** |
| Vite | `8.0.1` im Admin-Frontend | Astro 6 basiert auf Vite 7, Astro 6.1 erwähnt Vite-8-Kompatibilitätshinweise | **beobachten** |

## 3. Wichtige technische Erkenntnisse

### Astro 6.1 selbst ist nicht das Problem

Astro 6.1 ist aktuell und technisch erreichbar. Die lokale Node-Version erfüllt die Node-Anforderung von Astro 6 bereits.

### Der echte Blocker ist der fehlende Starter

Contypio hat aktuell:

- Delivery API
- TypeScript-SDK
- Hinweise auf Astro-Kompatibilität

Contypio hat aktuell **nicht nachweisbar im Repo**:

- ein vollständiges `starters/astro/`
- einen verifizierten Astro-Build
- eine produktionsreife Astro-Referenzintegration

### Python-Version ist für den CMS-Kern wichtiger als Next.js

Für die Headless-CMS-Positionierung unter Astro ist Next.js nur ein Nebenschauplatz. Kritischer sind:

- stabile Delivery API
- konsistente Python-Basis
- SDK-Verbrauch in Astro
- dokumentierter Build-/Deploy-Pfad

## 4. Empfehlung

### Sofort sinnvoll

1. Python-Zielversion verbindlich festlegen: bevorzugt `3.13.x`, alternativ direkt `3.14.x` nach Test
2. Astro-Starter real anlegen
3. SDK mit Astro 6.1 praktisch testen
4. Referenzprojekt mit Astro + Contypio bauen

### Noch nicht nötig

- Next.js 16 aktiv in Contypio integrieren
- TypeScript 6.0 sofort erzwingen, solange 5.9 stabil läuft

## 5. Fazit

Contypio ist **architektonisch astro-fähig**, aber **noch nicht astro-go-live-fähig**.  
Der Abstand liegt nicht in der API-Idee, sondern in fehlender Produktisierung: Starter, Demo, Doku, Tests und klarer Astro-Consumption-Path.

## 6. Quellen

- Astro 6.1: https://astro.build/blog/astro-610/
- Astro v6 Upgrade Guide: https://docs.astro.build/en/guides/upgrade-to/v6/
- Astro Releases: https://github.com/withastro/astro/releases
- Next.js 16 Upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16
- TypeScript 6.0: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- Python latest stable: https://www.python.org/downloads/latest/
