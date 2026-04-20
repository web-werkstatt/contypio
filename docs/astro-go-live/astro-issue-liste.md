# Contypio – Konkrete GitHub-/Gitea-Issue-Liste für Astro Go-Live

**Stand:** 20.04.2026  
**Format:** direkt übernehmbar für Gitea/GitHub

## 1. Astro Starter anlegen

**Titel:** `feat: create Astro 6.1 starter for Contypio`

**Beschreibung:**  
Lege `starters/astro/` als lauffähigen Starter an. Enthalten sein müssen `package.json`, `astro.config.mjs`, `src/pages/index.astro`, `src/pages/[...slug].astro`, Layout, Block-Renderer und Section-Renderer.

**Akzeptanzkriterien**

- `npm install` läuft in `starters/astro`
- `npm run dev` startet ohne Fehler
- `npm run build` läuft fehlerfrei

## 2. SDK im Astro Starter integrieren

**Titel:** `feat: wire @contypio/client into Astro starter`

**Beschreibung:**  
Binde `@contypio/client` in den Starter ein und hole Pages, Tree und Globals aus Contypio.

**Akzeptanzkriterien**

- Homepage lädt über SDK
- Slug-Seiten werden über Tree/Paths generiert
- Globals können im Layout verwendet werden

## 3. Minimale Block-Renderer für Astro bauen

**Titel:** `feat: implement base block renderer set for Astro`

**Beschreibung:**  
Implementiere die ersten produktrelevanten Blocktypen für Astro.

**Empfohlener Scope**

- RichText
- Image
- Cards
- CTA
- FAQ
- Gallery

**Akzeptanzkriterien**

- mindestens 4 Blocktypen gerendert
- unbekannte Blocktypen failen kontrolliert

## 4. Astro Demo/Referenzprojekt absichern

**Titel:** `feat: create Astro reference integration for Contypio`

**Beschreibung:**  
Erzeuge einen belastbaren End-to-End-Nachweis, dass Contypio mit Astro 6.1 produktiv verwendbar ist.

**Akzeptanzkriterien**

- statischer Build erzeugt Seiten aus CMS-Inhalten
- Globals werden eingebunden
- Beispielseiten sind dokumentiert

## 5. Support-Matrix dokumentieren

**Titel:** `docs: publish official Astro support matrix`

**Beschreibung:**  
Dokumentiere die offiziell unterstützten Versionen für Astro-Launch.

**Akzeptanzkriterien**

- Node, Python, TypeScript, Astro klar dokumentiert
- Launch-Zielversionen verbindlich benannt

## 6. Astro Quickstart schreiben

**Titel:** `docs: add Astro quickstart for Contypio`

**Beschreibung:**  
Erstelle eine schnelle Entwickleranleitung für Astro-Nutzer.

**Akzeptanzkriterien**

- Installation
- ENV-Variablen
- lokale Entwicklung
- Build
- Content-Fetching

## 7. API-Versionierung vorbereiten

**Titel:** `feat: add versioning strategy for delivery API`

**Beschreibung:**  
Führe `/api/v1/content/...` oder mindestens einen klar dokumentierten Migrationspfad für die Delivery API ein.

**Akzeptanzkriterien**

- Versionierungsstrategie im Code oder in verbindlicher Doku
- Auswirkungen auf SDK berücksichtigt

## 8. Onboarding und Seeds auf Singleton-Modell umstellen

**Titel:** `refactor: align onboarding and seed flow with singleton collections`

**Beschreibung:**  
Entferne den Architekturbruch zwischen Singleton-Collections und Legacy-Globals im Onboarding-Flow.

**Akzeptanzkriterien**

- neue Tenants starten ohne Legacy-Globals-Abhängigkeit
- Seeds und Onboarding sind konsistent

## 9. CI für SDK + Astro Starter

**Titel:** `ci: validate SDK and Astro starter on every change`

**Beschreibung:**  
Führe automatisierte Checks für SDK, Frontend und Astro-Starter ein.

**Akzeptanzkriterien**

- SDK build/typecheck
- Frontend lint
- Astro starter build

## 10. Astro Launch Page / Positionierung

**Titel:** `docs: prepare Astro launch positioning for Contypio`

**Beschreibung:**  
Erarbeite eine klare Positionierung von Contypio als Headless CMS für Astro.

**Akzeptanzkriterien**

- Why Contypio for Astro
- Supported use cases
- Limitations
- Link zu Demo und Starter
