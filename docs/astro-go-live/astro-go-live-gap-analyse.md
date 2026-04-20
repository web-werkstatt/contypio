# Contypio + Astro 6.1 – Go-Live Gap-Analyse

**Stand:** 20.04.2026  
**Ziel:** identifizieren, was fehlt, damit Contypio unter Astro als belastbares Headless CMS auftreten kann

## 1. Zielbild

Contypio soll für Astro-Teams als glaubwürdige Headless-CMS-Option funktionieren. Dafür reicht es nicht, nur eine API zu haben. Es braucht einen vollständigen Pfad von:

1. CMS
2. SDK
3. Astro-Starter
4. Demo / Referenz
5. Dokumentation
6. Go-Live-Prozess

## 2. Gaps

### G1 – Kein echter Astro-Starter im Repo

**Status:** offen

Der wichtigste Gap. Ohne Starter gibt es keinen direkten Einstieg für Astro-Nutzer.

**Fehlt konkret**

- `package.json`
- `astro.config.mjs`
- Seitenrouting
- Renderer für Contypio-Blocks
- Build-/Dev-Befehle
- README

### G2 – Keine verifizierte Astro-Referenzintegration

**Status:** offen

Es gibt Hinweise auf Astro-Nutzung, aber keinen belastbaren End-to-End-Nachweis im Repository, dass:

- Tree-Routing
- Page Fetching
- Global Fetching
- Block Rendering
- statischer Build

mit Astro 6.1 getestet sind.

### G3 – Delivery API ist stark, aber noch ohne API-Versionierung

**Status:** offen

Für eine echte Ecosystem-Aufnahme ist API-Stabilität zentral. Die Roadmap sieht Versionierung vor, der Code aktuell noch nicht.

### G4 – SDK ist vorhanden, aber Release- und Consumption-Pfad ist noch schwach

**Status:** teilweise offen

Das SDK existiert und ist funktional stark. Was noch fehlt:

- klarer Publish-/Version-Flow
- harte Astro-Referenzbeispiele gegen aktuellen Stand
- CI-Absicherung für SDK + Astro-Starter zusammen

### G5 – Doku und Positionierung sind noch nicht astro-launch-reif

**Status:** offen

Was fehlt:

- offizieller Astro-Quickstart
- Schritt-für-Schritt-Anbindung
- Deploy-Empfehlung
- Einschränkungen / bekannte Grenzen
- „Why Contypio for Astro?“ sauber formuliert

### G6 – Python-/Runtime-Matrix ist noch nicht sauber ausformuliert

**Status:** teilweise offen

Der Repo-Stand zeigt:

- README spricht von Python 3.13
- lokale Umgebung ist 3.11.2
- extern ist 3.14 aktuell

Für Go-Live braucht es eine klare Aussage:

- supported version
- tested version
- recommended version

## 3. Was bereits stark genug ist

- Delivery API
- i18n-Grundlage
- Batch / Cursor / Schema-Endpoint
- Security-Basis
- TypeScript-SDK
- Self-Hosting-Architektur

Das heißt: Contypio muss für Astro **nicht neu erfunden** werden. Es muss **produktfähig verpackt** werden.

## 4. Kritische Go-Live-Kriterien

Contypio ist unter Astro erst dann wirklich go-live-fähig, wenn folgende Punkte erfüllt sind:

1. Ein Astro-6.1-Starter baut lokal fehlerfrei.
2. Der Starter rendert:
   - Homepage
   - dynamische Slug-Seiten
   - Globals
   - mehrere Blocktypen
3. Das SDK funktioniert im Starter ohne Workarounds.
4. Die unterstützten Versionen sind dokumentiert.
5. Der Build-/Deploy-Prozess ist reproduzierbar.
6. Es gibt mindestens eine Referenzdemo.

## 5. Fazit

Der Hauptgap ist **nicht die CMS-Fähigkeit**, sondern die **fehlende Astro-Produktisierung**.  
Contypio ist aus Code-Sicht nahe an einem Astro-Launch, aber noch nicht in dem Zustand, den Astro-Nutzer als fertige Headless-CMS-Lösung erwarten würden.

## 6. Quellen

- Astro 6.1: https://astro.build/blog/astro-610/
- Astro v6 Upgrade Guide: https://docs.astro.build/en/guides/upgrade-to/v6/
- Next.js 16 Upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16
- TypeScript 6.0: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- Python latest stable: https://www.python.org/downloads/latest/
