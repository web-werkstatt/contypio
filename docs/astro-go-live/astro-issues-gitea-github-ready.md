# Contypio – Astro Issues in GitHub/Gitea Format

**Stand:** 20.04.2026  
**Zweck:** direkt copy-paste-fähige Issues für GitHub oder Gitea

## Label-Vorschlag

Nutze diese Labels konsistent:

- `priority:P0`
- `priority:P1`
- `priority:P2`
- `type:feature`
- `type:refactor`
- `type:docs`
- `type:ci`
- `area:astro`
- `area:sdk`
- `area:api`
- `area:docs`
- `area:onboarding`
- `status:ready`

## Milestone-Vorschlag

- `Astro Sprint 1 – Foundations`
- `Astro Sprint 2 – Starter MVP`
- `Astro Sprint 3 – Reference Integration`
- `Astro Sprint 4 – Docs & DX`
- `Astro Sprint 5 – Governance & Stability`

---

## Issue 1

**Titel**  
`feat: create Astro 6.1 starter for Contypio`

**Labels**  
`priority:P0`, `type:feature`, `area:astro`, `status:ready`

**Milestone**  
`Astro Sprint 2 – Starter MVP`

**Beschreibung**  
Erstelle ein lauffähiges Astro-6.1-Starterprojekt unter `starters/astro/`, das als offizieller Einstiegspunkt für Contypio als Headless CMS dient.

**Scope**

- `package.json`
- `astro.config.mjs`
- `.env.example`
- `src/pages/index.astro`
- `src/pages/[...slug].astro`
- `src/layouts/BaseLayout.astro`
- `src/components/SectionRenderer.astro`
- `src/components/BlockRenderer.astro`

**Akzeptanzkriterien**

- `npm install` läuft in `starters/astro`
- `npm run dev` startet ohne Fehler
- `npm run build` läuft fehlerfrei
- Astro-Version ist `6.1.x`
- Node-Anforderung ist dokumentiert

**Abhängigkeiten**

- Support-Matrix festgelegt

**Definition of Done**

- Starter ist im Repo vorhanden
- Build wurde lokal erfolgreich ausgeführt
- README-Grundstruktur existiert

---

## Issue 2

**Titel**  
`feat: wire @contypio/client into Astro starter`

**Labels**  
`priority:P0`, `type:feature`, `area:astro`, `area:sdk`, `status:ready`

**Milestone**  
`Astro Sprint 2 – Starter MVP`

**Beschreibung**  
Binde `@contypio/client` in den Astro-Starter ein und nutze es für Page-, Tree- und Globals-Fetching.

**Akzeptanzkriterien**

- Homepage lädt Content über SDK
- dynamische Slug-Seiten nutzen den Tree bzw. Page-Fetch
- Globals können im Layout genutzt werden
- keine direkten API-Fetches, wo das SDK ausreicht

**Abhängigkeiten**

- `feat: create Astro 6.1 starter for Contypio`

**Definition of Done**

- SDK läuft im Starter ohne Sonderpfade
- ENV-Konfiguration ist dokumentiert

---

## Issue 3

**Titel**  
`feat: implement base block renderer set for Astro`

**Labels**  
`priority:P0`, `type:feature`, `area:astro`, `status:ready`

**Milestone**  
`Astro Sprint 2 – Starter MVP`

**Beschreibung**  
Implementiere den ersten Satz produktrelevanter Blocktypen für den Astro-Starter.

**Mindestumfang**

- RichText
- Image
- Cards
- CTA
- FAQ
- Gallery

**Akzeptanzkriterien**

- mindestens 4 Blocktypen sind vollständig renderbar
- unbekannte Blocktypen failen kontrolliert
- Renderer-Struktur ist erweiterbar

**Abhängigkeiten**

- `feat: create Astro 6.1 starter for Contypio`
- `feat: wire @contypio/client into Astro starter`

**Definition of Done**

- echte CMS-Daten werden in Astro gerendert
- Block-Rendering ist dokumentiert

---

## Issue 4

**Titel**  
`feat: create Astro reference integration for Contypio`

**Labels**  
`priority:P0`, `type:feature`, `area:astro`, `area:docs`, `status:ready`

**Milestone**  
`Astro Sprint 3 – Reference Integration`

**Beschreibung**  
Erzeuge eine belastbare Referenzintegration, die zeigt, dass Contypio mit Astro 6.1 produktiv eingesetzt werden kann.

**Akzeptanzkriterien**

- statischer Build erzeugt Seiten aus CMS-Inhalten
- Globals sind im Layout eingebunden
- Beispielseiten sind dokumentiert
- mindestens ein Demo-Tenant oder Demo-Content ist nutzbar

**Abhängigkeiten**

- Starter MVP vorhanden
- Basis-Blockrenderer vorhanden

**Definition of Done**

- es gibt einen echten End-to-End-Nachweis im Repo

---

## Issue 5

**Titel**  
`docs: publish official Astro support matrix`

**Labels**  
`priority:P0`, `type:docs`, `area:docs`, `area:astro`, `status:ready`

**Milestone**  
`Astro Sprint 1 – Foundations`

**Beschreibung**  
Dokumentiere die offiziell unterstützten Versionen für Astro-Go-Live.

**Akzeptanzkriterien**

- Node, Python, TypeScript und Astro sind klar dokumentiert
- Supported / Tested / Planned ist getrennt
- Launch-Zielversionen sind eindeutig

**Abhängigkeiten**

- keine

**Definition of Done**

- Support-Matrix liegt im Repo vor und ist referenzierbar

---

## Issue 6

**Titel**  
`docs: add Astro quickstart for Contypio`

**Labels**  
`priority:P1`, `type:docs`, `area:docs`, `area:astro`, `status:ready`

**Milestone**  
`Astro Sprint 4 – Docs & DX`

**Beschreibung**  
Erstelle einen Quickstart für Astro-Nutzer, die Contypio als Headless CMS einsetzen wollen.

**Akzeptanzkriterien**

- Installation beschrieben
- ENV-Variablen beschrieben
- lokale Entwicklung beschrieben
- Build beschrieben
- SDK-Nutzung beschrieben

**Abhängigkeiten**

- Starter MVP

**Definition of Done**

- externer Entwickler kann den Starter ohne Zusatzwissen starten

---

## Issue 7

**Titel**  
`feat: add versioning strategy for delivery API`

**Labels**  
`priority:P1`, `type:feature`, `area:api`, `status:ready`

**Milestone**  
`Astro Sprint 5 – Governance & Stability`

**Beschreibung**  
Führe eine belastbare Versionierungsstrategie für die Delivery API ein, idealerweise mit `/api/v1/content/...` und dokumentiertem Deprecation-Pfad.

**Akzeptanzkriterien**

- Versionierungsstrategie ist im Code oder in verbindlicher Doku festgelegt
- Auswirkungen auf SDK sind berücksichtigt
- Alt- und Zielpfade sind beschrieben

**Abhängigkeiten**

- Referenzintegration vorhanden

**Definition of Done**

- API-Evolution ist für Astro-/SDK-Konsumenten planbar

---

## Issue 8

**Titel**  
`refactor: align onboarding and seed flow with singleton collections`

**Labels**  
`priority:P1`, `type:refactor`, `area:onboarding`, `area:api`, `status:ready`

**Milestone**  
`Astro Sprint 5 – Governance & Stability`

**Beschreibung**  
Beseitige den Architekturbruch zwischen Singleton-Collections und Legacy-Globals in Onboarding und Seeds.

**Akzeptanzkriterien**

- neue Tenants starten ohne Legacy-Globals-Abhängigkeit
- Onboarding und Seed-Flow folgen dem Singleton-Zielmodell
- Delivery-Fallback bleibt nur, wenn noch nötig

**Abhängigkeiten**

- keine harte, aber sinnvoll nach Starter MVP

**Definition of Done**

- Onboarding erzeugt konsistente Datenbasis

---

## Issue 9

**Titel**  
`ci: validate SDK and Astro starter on every change`

**Labels**  
`priority:P1`, `type:ci`, `area:astro`, `area:sdk`, `area:docs`, `status:ready`

**Milestone**  
`Astro Sprint 5 – Governance & Stability`

**Beschreibung**  
Führe CI-Checks für SDK, Frontend und Astro-Starter ein.

**Akzeptanzkriterien**

- SDK build/typecheck läuft automatisiert
- Frontend lint läuft automatisiert
- Astro starter build läuft automatisiert

**Abhängigkeiten**

- Starter MVP vorhanden

**Definition of Done**

- jede relevante Änderung wird automatisiert geprüft

---

## Issue 10

**Titel**  
`docs: prepare Astro launch positioning for Contypio`

**Labels**  
`priority:P2`, `type:docs`, `area:docs`, `area:astro`, `status:ready`

**Milestone**  
`Astro Sprint 4 – Docs & DX`

**Beschreibung**  
Formuliere Contypio klar als Headless-CMS-Option für Astro-Nutzer.

**Akzeptanzkriterien**

- Why Contypio for Astro
- Supported use cases
- Known limitations
- Links zu Starter, Demo und SDK

**Abhängigkeiten**

- Referenzintegration vorhanden

**Definition of Done**

- Außenkommunikation passt zum tatsächlichen Produktstand

---

## Empfohlene Reihenfolge

1. `docs: publish official Astro support matrix`
2. `feat: create Astro 6.1 starter for Contypio`
3. `feat: wire @contypio/client into Astro starter`
4. `feat: implement base block renderer set for Astro`
5. `feat: create Astro reference integration for Contypio`
6. `docs: add Astro quickstart for Contypio`
7. `docs: prepare Astro launch positioning for Contypio`
8. `feat: add versioning strategy for delivery API`
9. `refactor: align onboarding and seed flow with singleton collections`
10. `ci: validate SDK and Astro starter on every change`
