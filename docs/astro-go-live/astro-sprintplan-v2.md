# Contypio – Astro 6.1 Sprintplan v2

**Stand:** 20.04.2026
**Basis:** SOLL-IST-Analyse + Review & Challenge (April 2026)
**Änderungen gegenüber v1:** CI in Sprint 2, API-Versionierungsentscheidung in Sprint 1 verankert, SDK-Release-Strategie und Block-Fallback explizit definiert

---

## Sprint 1 – Technische Leitplanken + verbindliche Entscheidungen

**Ziel:** Alle strategischen Entscheidungen, die Folgesprints blockieren können, werden in Sprint 1 getroffen – nicht dokumentiert, sondern entschieden.

### Aufgaben

#### 1.1 Support-Matrix veröffentlichen
- Node `22.12.0+`, Python `3.13.x`, TypeScript `5.9.x`, Astro `6.1.x` als offizielle Zielversionen festschreiben
- `docs/astro-go-live/support-matrix.md` als autoritäres Dokument markieren
- `.python-version`-Datei ins Repo-Root eintragen

#### 1.2 API-Versionierungsentscheidung treffen (Pflicht, kein Backlog)

**Entscheidung bis Sprint-Ende:** Eine der beiden Strategien wird verbindlich gewählt:

| Option | Beschreibung | Aufwand | Konsequenz |
|---|---|---|---|
| **A – `/api/v1/`-Präfix implementieren** | FastAPI-Router unter `/api/v1/content/...` einführen | 3–5 h | Sauberer Vertrag, SDK-Basis-URL anpassen, kein Breaking Change für Nutzer |
| **B – Kein Präfix, Changelog-Commitment** | Bestehende Routen bleiben, explizites Versprechen: keine Breaking Changes ohne Ankündigung + Changelog | 1–2 h | Schneller, aber Nutzer tragen Risiko; nur akzeptabel wenn Breaking Changes ausgeschlossen sind |

**Ergebnis dieser Aufgabe:** Entscheidungsprotokoll in `docs/astro-go-live/adr-api-versioning.md` (Architecture Decision Record, 1 Seite).

#### 1.3 SDK-Release-Strategie festlegen (Pflicht, kein Backlog)

**Entscheidung bis Sprint-Ende:** Eine der beiden Strategien wird verbindlich gewählt:

| Option | Beschreibung | Geeignet für |
|---|---|---|
| **A – npm-Publish** | `@contypio/client` wird auf npmjs.com veröffentlicht; Starter referenziert via `"@contypio/client": "^x.y.z"` | Externe Nutzer, Community-Launch |
| **B – Workspace-Link** | Starter referenziert via `"@contypio/client": "file:../../packages/contypio-client"`; kein npm nötig | Interner Demo-Starter, schneller, aber kein echter DX für Externe |

Wenn das Ziel ein öffentlicher Astro-Go-Live für externe Entwickler ist: **Option A ist Pflicht.**

**Ergebnis dieser Aufgabe:** Entscheidungsprotokoll in `docs/astro-go-live/adr-sdk-release.md`.

#### 1.4 Block-Fallback-Verhalten verbindlich spezifizieren

Kein „failen kontrolliert" als Akzeptanzkriterium. Das verbindliche Verhalten ab Sprint 2:

- Unbekannter Block-Typ → rendert `<UnknownBlock type="xyz" />` (sichtbar im Dev-Mode, unsichtbar/leer im Prod-Build)
- Kein Page-Crash, kein unbehandelter Fehler
- Block-Type wird in die Browser-Console geloggt (`console.warn`)
- Error Boundary auf Section-Ebene: ein fehlerhafte Block zerstört nicht die restliche Seite

**Ergebnis:** Diese Spezifikation gilt als Akzeptanzkriterium für Issue #3 (Block-Renderer).

#### 1.5 Astro-Consumption-Path dokumentieren

- Welche Delivery-API-Endpunkte nutzt der Starter?
- Welche Response-Felder sind „stabil" für den Launch?
- Wo sind bewusste Einschränkungen (z.B. kein Echtzeit-Preview)?

### Aufwand

**0.5–1 Tag** (Entscheidungen, kein Code)

### Ergebnis Sprint 1

- [ ] Support-Matrix öffentlich im Repo
- [ ] `adr-api-versioning.md` vorhanden und entschieden
- [ ] `adr-sdk-release.md` vorhanden und entschieden
- [ ] Block-Fallback-Spezifikation schriftlich fixiert
- [ ] Astro-Consumption-Path dokumentiert

---

## Sprint 2 – Astro Starter MVP + CI-Grundgerüst

**Ziel:** Ersten lauffähigen Astro-Starter bauen und sofort mit CI absichern. CI wird nicht nach dem Starter gebaut – sie wächst mit ihm.

### Aufgaben

#### 2.1 `starters/astro/` anlegen

Minimale Dateistruktur:

```
starters/astro/
  package.json
  astro.config.mjs
  .env.example
  src/
    pages/
      index.astro
      [...slug].astro
    layouts/
      BaseLayout.astro
    components/
      BlockRenderer.astro
      SectionRenderer.astro
      blocks/
        RichText.astro
        Image.astro
        CTA.astro
        Cards.astro
        UnknownBlock.astro        ← Block-Fallback gem. Sprint-1-Spezifikation
```

#### 2.2 SDK-package.json korrigieren (Repo-Fund RF-1)

**Vor jedem anderen SDK-Schritt:**
- `packages/contypio-client/package.json`, Zeile 39: `"engines": { "node": ">=18.0.0" }` → `">=22.12.0"`
- Astro 6 verlangt Node 22.12.0+; mit `>=18.0.0` ist die Kompatibilitätsaussage des SDK schlicht falsch

#### 2.3 SDK einbinden (gem. ADR aus Sprint 1)

- Starter referenziert `@contypio/client` gemäß gewählter Release-Strategie
- `getStaticPaths()` via Page Tree
- Homepage, Slug-Seiten, Globals im Layout

#### 2.4 CI-Grundgerüst anlegen (parallel zum Starter, nicht danach)

Workflow-Datei: `.github/workflows/astro-starter.yml` (oder Gitea-Äquivalent)

```yaml
jobs:
  sdk-typecheck:
    run: cd packages/contypio-client && npm run typecheck

  frontend-lint:
    run: cd frontend && npm run lint

  astro-build:
    run: cd starters/astro && npm ci && npm run build
```

**Pflicht:** Jeder Commit auf `main` muss alle drei Jobs grün haben.

#### 2.5 Block-Fallback implementieren (gem. Sprint-1-Spezifikation)

`UnknownBlock.astro` + Error Boundary auf Section-Ebene – nicht als Nice-to-have, sondern als Teil des MVP.

#### 2.6 API-Versionierung implementieren (wenn ADR Option A gewählt)

FastAPI-Router unter `/api/v1/content/...` einführen, SDK-Basis-URL anpassen.

### Aufwand

**3–5 Tage**

### Ergebnis Sprint 2

- [ ] `npm install` in `starters/astro/` läuft
- [ ] `npm run dev` startet ohne Fehler
- [ ] `npm run build` läuft fehlerfrei (lokal)
- [ ] CI-Pipeline grün auf erstem Commit
- [ ] UnknownBlock-Fallback implementiert und manuell getestet
- [ ] SDK-Integration verifiziert (Homepage + Slug-Routing)

---

## Sprint 3 – Referenzintegration + Demo

**Ziel:** Belastbarer End-to-End-Nachweis mit echtem Content. Der statische Build muss auf einer öffentlichen URL erreichbar sein – das ist ein **Launch-Gate**, kein optionaler Schritt.

### Aufgaben

#### 3.1 Demo-Tenant anlegen + Content seeden

- Demo-Tenant in Contypio anlegen
- Seeder mit realistischem Content: min. 5 Seiten, 2 Globals, 4 Blocktypen
- Seed-Script dokumentieren (reproduzierbar)

#### 3.2 Referenzintegration absichern

Muss nachweisbar funktionieren:

- [ ] Homepage aus CMS
- [ ] Dynamische Slug-Seiten via `getStaticPaths()` + Page Tree
- [ ] Globals im Layout (z.B. Navigation, Footer)
- [ ] Mindestens 4 Blocktypen gerendert: RichText, Image, CTA, Cards
- [ ] UnknownBlock-Fallback mit min. 1 unbekanntem Blocktyp verifiziert
- [ ] Statischer Build erzeugt alle erwarteten HTML-Seiten

#### 3.3 Demo deployen (Launch-Gate)

- Deployment auf Vercel, Netlify oder eigenem Server
- Demo-URL intern verfügbar und erreichbar
- Uptime-Monitoring einrichten (UptimeRobot o.ä., kostenlos)

#### 3.4 Fehlerszenarien dokumentieren

- Was passiert bei API-Ausfall? (Build-Fehler, nicht stiller Fehler)
- Was passiert bei leerem Page Tree?
- Was passiert bei fehlendem Global?

### Aufwand

**2–3 Tage**

### Ergebnis Sprint 3

- [ ] Statischer Build mit echtem CMS-Content verifiziert
- [ ] Demo auf öffentlicher URL erreichbar
- [ ] Uptime-Monitor aktiv
- [ ] Fehlerszenarien dokumentiert

---

## Sprint 4 – Dokumentation + Developer Experience

**Ziel:** Astro-Entwickler sollen Contypio ohne Rückfragen starten können. Kein Starter-Launch ohne vollständige DX-Dokumentation.

### Aufgaben

#### 4.1 Astro Quickstart schreiben

Pflichtinhalt (kein Punkt darf fehlen):

1. Voraussetzungen (Node, Python, Contypio-Instanz)
2. Installation (`npm create` oder `git clone`)
3. ENV-Variablen (`.env.example` erklären)
4. Lokale Entwicklung (`npm run dev`)
5. Content fetchen (SDK-Beispiel für Pages + Globals)
6. Statischer Build (`npm run build`)
7. Deploy-Empfehlung (Vercel/Netlify mit Beispiel-Config)

#### 4.2 Starter-README schreiben

- Kurzübersicht (3 Sätze)
- Quickstart-Link
- Unterstützte Blocktypen mit Liste
- Known Limitations (explizit, ehrlich)

#### 4.3 Known Limitations dokumentieren

Mindestinhalt:

- Kein Echtzeit-Preview im Starter
- Blocktypen die noch nicht unterstützt werden
- Python-/Node-Versionsanforderungen
- Was passiert bei unbekannten Blocktypen (Verweis auf Fallback-Verhalten)

#### 4.4 SDK-Dokumentation auf Astro-Starter abgleichen

- README-Beispiele gegen echten Starter-Code verifizieren
- Falsche oder veraltete Beispiele korrigieren

#### 4.5 „Why Contypio for Astro?" formulieren

- Zielgruppe: Astro-Entwickler die ein Self-Hosted Headless CMS suchen
- 3–5 konkrete Vorteile (keine Marketing-Phrasen)
- Ehrliche Einschränkungen
- Link zu Demo + Starter

### Aufwand

**1.5–2.5 Tage**

### Ergebnis Sprint 4

- [ ] Astro Quickstart veröffentlicht
- [ ] Starter-README vollständig
- [ ] Known Limitations dokumentiert
- [ ] SDK-Doku gegen Starter verifiziert
- [ ] Positionierungstext fertig

---

## Sprint 5 – Stabilität, Legacy-Cleanup, Launch-Freigabe

**Ziel:** Launch tragfähig absichern. Kein Go-Live ohne grüne Checkliste am Ende dieses Sprints.

### Aufgaben

#### 5.1 Onboarding + Seeds auf Singleton-Collections umstellen

- Legacy-Globals-Seed aus Onboarding-Flow entfernen
- `backend/app/api/globals.py` und `backend/app/models/global_config.py` prüfen: noch benötigt?
- Wenn nicht: als Deprecated markieren + Entfernung im nächsten Release einplanen
- Neue Tenants starten ohne Architekturbruch

#### 5.2 CI erweitern

- E2E-Smoke-Test: Astro-Build erzeugt erwartete HTML-Seiten (mind. Homepage + 1 Slug-Seite)
- CI schlägt fehl wenn Demo-URL nicht erreichbar (optional: Healthcheck-Job)

#### 5.3 SDK-Release-Prozess finalisieren (gem. ADR Sprint 1)

Wenn Option A (npm-Publish) gewählt:
- SemVer-Schema definieren (`major.minor.patch`)
- CHANGELOG.md anlegen
- npm-Publish-Workflow in CI integrieren (manuell getriggert oder tag-basiert)
- Erstes offizielles Release: `@contypio/client@1.0.0`

#### 5.4 Launch-Checkliste durcharbeiten

Kein Go-Live ohne alle Punkte grün:

- [ ] `starters/astro/` baut lokal fehlerfrei
- [ ] CI-Pipeline grün (SDK + Lint + Astro-Build + Smoke-Test)
- [ ] Demo auf öffentlicher URL erreichbar + Uptime-Monitor aktiv
- [ ] Mindestens 4 Blocktypen verifiziert, UnknownBlock-Fallback aktiv
- [ ] Astro Quickstart veröffentlicht
- [ ] Known Limitations dokumentiert
- [ ] Support-Matrix öffentlich
- [ ] ADR zu API-Versionierung + SDK-Release vorhanden
- [ ] Onboarding ohne Legacy-Globals

#### 5.5 Positionierung publizieren

- README astro-first umbauen
- „Why Contypio for Astro?" in README oder Docs einbauen
- Demo-URL in README verlinken

### Aufwand

**2–3 Tage**

### Ergebnis Sprint 5

- [ ] Launch-Checkliste 100 % grün
- [ ] SDK-Release-Prozess dokumentiert und mindestens einmal durchgespielt
- [ ] Legacy-Globals aus Onboarding entfernt
- [ ] Positionierung live

---

## Gesamtübersicht

| Sprint | Fokus | Aufwand | Kritischer Output |
|---|---|---|---|
| 1 | Entscheidungen + Leitplanken | 0.5–1 Tag | API-ADR, SDK-ADR, Block-Fallback-Spec |
| 2 | Astro Starter MVP + CI | 3–5 Tage | Lauffähiger Starter + grüne Pipeline |
| 3 | Referenzintegration + Demo | 2–3 Tage | Demo auf öffentlicher URL |
| 4 | Doku + DX | 1.5–2.5 Tage | Quickstart + Known Limitations |
| 5 | Cleanup + Launch-Freigabe | 2–3 Tage | Launch-Checkliste 100 % grün |
| **Gesamt** | | **9–14.5 Tage** | |

---

## Änderungen gegenüber Sprintplan v1

| Thema | v1 | v2 |
|---|---|---|
| CI | Sprint 5 | Sprint 2 (parallel zum Starter) |
| API-Versionierungsentscheidung | Sprint 1 „dokumentieren" | Sprint 1 **verbindlich entscheiden** (ADR) |
| API-Versionierungsimplementierung | Sprint 5 Must-Have | Sprint 2 (wenn ADR Option A) |
| SDK-Release-Strategie | nicht explizit adressiert | Sprint 1 Entscheidung (ADR), Sprint 5 Umsetzung |
| Block-Fallback | „failen kontrolliert" (vage) | Verbindliche Spezifikation Sprint 1, Implementierung Sprint 2 |
| E2E-Smoke-Test | nicht vorhanden | Sprint 5 als CI-Job |
| Demo als Launch-Gate | Sprint-Ziel (optional) | Pflicht-Kriterium für Go-Live |
| Monitoring | nicht erwähnt | Uptime-Monitor Sprint 3 |
