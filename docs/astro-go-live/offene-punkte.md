# Contypio Astro 6.1 – Offene Punkte (Gesamtübersicht)

**Stand:** 20.04.2026
**Basis:** SOLL-IST-Analyse, Review & Challenge, Sprintplan v2, Repo-Check

Dieses Dokument ist die einzige autoritative Quelle für den Stand aller offenen Punkte.
Beim Abschluss eines Punktes: Status auf `ERLEDIGT` setzen + Datum.

---

## Legende

| Status | Bedeutung |
|---|---|
| `OFFEN` | Nicht begonnen |
| `IN ARBEIT` | Aktiv in Bearbeitung |
| `ENTSCHEIDUNG NÖTIG` | Blockiert auf Entscheidung |
| `ERLEDIGT` | Abgeschlossen |

---

## Sprint 1 – Entscheidungen + Leitplanken

| # | Aufgabe | Status | Blocker / Anmerkung |
|---|---|---|---|
| S1-1 | Support-Matrix als offizielle Doku veröffentlichen | `OFFEN` | `docs/astro-go-live/support-matrix.md` existiert, aber nicht verlinkt/sichtbar |
| S1-2 | `.python-version`-Datei ins Repo-Root | `OFFEN` | – |
| S1-3 | **ADR: API-Versionierung entscheiden** | `ENTSCHEIDUNG NÖTIG` | Siehe `adr-api-versioning.md` |
| S1-4 | **ADR: SDK-Release-Strategie entscheiden** | `ENTSCHEIDUNG NÖTIG` | Siehe `adr-sdk-release.md` |
| S1-5 | Block-Fallback-Verhalten verbindlich spezifizieren | `OFFEN` | Spec liegt in `astro-sprintplan-v2.md` Sprint 2 |
| S1-6 | Astro-Consumption-Path dokumentieren | `OFFEN` | Welche Endpunkte, welche Response-Felder gelten als stabil? |

---

## Sprint 2 – Astro Starter MVP + CI

| # | Aufgabe | Status | Blocker / Anmerkung |
|---|---|---|---|
| S2-1 | `starters/astro/` anlegen | `OFFEN` | Verzeichnis existiert nicht im Repo |
| S2-2 | `package.json` für Starter | `OFFEN` | – |
| S2-3 | `astro.config.mjs` | `OFFEN` | – |
| S2-4 | `.env.example` | `OFFEN` | – |
| S2-5 | `src/pages/index.astro` | `OFFEN` | – |
| S2-6 | `src/pages/[...slug].astro` | `OFFEN` | – |
| S2-7 | `src/layouts/BaseLayout.astro` | `OFFEN` | – |
| S2-8 | `src/components/BlockRenderer.astro` | `OFFEN` | – |
| S2-9 | `src/components/SectionRenderer.astro` | `OFFEN` | – |
| S2-10 | `src/components/blocks/RichText.astro` | `OFFEN` | – |
| S2-11 | `src/components/blocks/Image.astro` | `OFFEN` | – |
| S2-12 | `src/components/blocks/CTA.astro` | `OFFEN` | – |
| S2-13 | `src/components/blocks/Cards.astro` | `OFFEN` | – |
| S2-14 | `src/components/blocks/UnknownBlock.astro` | `OFFEN` | Block-Fallback gem. Sprint-1-Spec |
| S2-15 | SDK in Starter einbinden (gem. ADR) | `ENTSCHEIDUNG NÖTIG` | Blockiert auf S1-4 |
| S2-16 | **CI-Grundgerüst anlegen** | `OFFEN` | `.github/workflows/` existiert nicht |
| S2-17 | CI-Job: SDK typecheck | `OFFEN` | – |
| S2-18 | CI-Job: Frontend lint | `OFFEN` | – |
| S2-19 | CI-Job: Astro-Starter build | `OFFEN` | – |
| S2-20 | **`engines.node` in SDK-package.json korrigieren** | `OFFEN` | Aktuell `>=18.0.0`, muss `>=22.12.0` sein – Repo-Fund |
| S2-21 | API-Versionierung implementieren (wenn ADR Option A) | `ENTSCHEIDUNG NÖTIG` | Blockiert auf S1-3 |

---

## Sprint 3 – Referenzintegration + Demo

| # | Aufgabe | Status | Blocker / Anmerkung |
|---|---|---|---|
| S3-1 | Demo-Tenant in Contypio anlegen | `OFFEN` | – |
| S3-2 | Demo-Content seeden (min. 5 Seiten, 2 Globals, 4 Blocktypen) | `OFFEN` | – |
| S3-3 | Seed-Script dokumentieren (reproduzierbar) | `OFFEN` | – |
| S3-4 | Homepage aus CMS verifizieren | `OFFEN` | Blockiert auf S2-1 ff. |
| S3-5 | Dynamische Slug-Seiten via `getStaticPaths()` | `OFFEN` | – |
| S3-6 | Globals im Layout einbinden | `OFFEN` | – |
| S3-7 | Mindestens 4 Blocktypen gerendert | `OFFEN` | – |
| S3-8 | UnknownBlock-Fallback mit echtem unbekanntem Block verifiziert | `OFFEN` | – |
| S3-9 | Statischer Build erzeugt alle erwarteten HTML-Seiten | `OFFEN` | – |
| S3-10 | **Demo deployen auf öffentlicher URL** | `OFFEN` | Launch-Gate: kein Go-Live ohne diese URL |
| S3-11 | Uptime-Monitoring für Demo-URL einrichten | `OFFEN` | UptimeRobot o.ä. |
| S3-12 | Fehlerszenarien dokumentieren (API-Ausfall, leer, fehlendes Global) | `OFFEN` | – |

---

## Sprint 4 – Dokumentation + DX

| # | Aufgabe | Status | Blocker / Anmerkung |
|---|---|---|---|
| S4-1 | Astro Quickstart schreiben | `OFFEN` | – |
| S4-2 | Starter-README schreiben | `OFFEN` | – |
| S4-3 | Known Limitations dokumentieren | `OFFEN` | – |
| S4-4 | SDK-README gegen echten Starter-Code verifizieren | `OFFEN` | – |
| S4-5 | „Why Contypio for Astro?" formulieren | `OFFEN` | – |
| S4-6 | Deploy-Empfehlung schreiben (Vercel/Netlify mit Beispiel) | `OFFEN` | – |

---

## Sprint 5 – Cleanup + Launch-Freigabe

| # | Aufgabe | Status | Blocker / Anmerkung |
|---|---|---|---|
| S5-1 | **Legacy-Globals-Seed aus Onboarding entfernen** | `OFFEN` | Bestätigt aktiv in `backend/app/api/tenants.py:354` |
| S5-2 | `backend/app/api/globals.py` + `backend/app/models/global_config.py` prüfen | `OFFEN` | Noch produktiv benötigt? |
| S5-3 | CI: E2E-Smoke-Test (Homepage + 1 Slug-Seite als HTML-Output) | `OFFEN` | – |
| S5-4 | **SDK-Release-Prozess finalisieren (gem. ADR)** | `ENTSCHEIDUNG NÖTIG` | Blockiert auf S1-4 |
| S5-5 | CHANGELOG.md anlegen | `OFFEN` | – |
| S5-6 | npm-Publish-Workflow in CI (wenn ADR Option A) | `ENTSCHEIDUNG NÖTIG` | – |
| S5-7 | Erstes offizielles Release: `@contypio/client@1.0.0` | `ENTSCHEIDUNG NÖTIG` | `1.0.0` oder weiter `0.x`? |
| S5-8 | Launch-Checkliste vollständig abhaken | `OFFEN` | Kein Go-Live ohne 100 % |
| S5-9 | README astro-first umbauen | `OFFEN` | – |
| S5-10 | Demo-URL in README verlinken | `OFFEN` | Blockiert auf S3-10 |

---

## Repo-Funde: Konkrete Bugs / Korrekturen die vor Launch nötig sind

Diese Punkte wurden direkt im Code gefunden und sind unabhängig von Sprint-Zuordnung:

| # | Fund | Datei | Zeile | Korrektur |
|---|---|---|---|---|
| RF-1 | `engines.node: ">=18.0.0"` zu niedrig für Astro 6 | `packages/contypio-client/package.json` | 39 | ~~`">=22.12.0"` setzen~~ **ERLEDIGT 20.04.2026** |
| RF-2 | Kein `publishConfig` für scoped npm package | `packages/contypio-client/package.json` | – | `"publishConfig": { "access": "public" }` ergänzen (wenn npm-Publish) |
| RF-3 | Kein `/v1/`-Präfix – alle Delivery-Router ohne Versionierung | `backend/app/main.py` | 226–233 | Entscheidung per ADR, dann implementieren |
| RF-4 | Legacy-Globals-Seed aktiv im Onboarding-Flow | `backend/app/api/tenants.py` | 354–384 | Entfernen nach Singleton-Migration |
| RF-5 | Keine CI-Konfiguration im Repo | `.github/` | – | Workflow-Dateien anlegen in Sprint 2 |
| RF-6 | `starters/astro/` existiert nicht | – | – | Sprint 2 |

---

## Offene Entscheidungen (blockieren mehrere Punkte)

| # | Entscheidung | Blockiert | Deadline |
|---|---|---|---|
| E-1 | API-Versionierung: Option A (`/v1/`) oder Option B (kein Präfix) | S1-3, S2-21, RF-3 | Ende Sprint 1 |
| E-2 | SDK-Release: npm-Publish oder Workspace-Link | S1-4, S2-15, S5-4, S5-6, RF-2 | Ende Sprint 1 |
| E-3 | SDK-Versionsnummer zum Launch: `1.0.0` oder `0.4.0` | S5-7 | Vor Sprint 5 |
| E-4 | Preview- und Cache-Router auch unter `/v1/` oder nur Delivery? | S1-3 | Ende Sprint 1 |

---

## Launch-Gate-Checkliste (kein Go-Live ohne alle grün)

- [ ] `starters/astro/` baut lokal fehlerfrei (`npm run build`)
- [ ] CI-Pipeline grün: SDK typecheck + Astro-Build + Smoke-Test
- [ ] Demo auf öffentlicher URL erreichbar
- [ ] Uptime-Monitor aktiv
- [ ] Mindestens 4 Blocktypen verifiziert, UnknownBlock-Fallback aktiv
- [ ] Astro Quickstart veröffentlicht
- [ ] Known Limitations dokumentiert
- [ ] Support-Matrix öffentlich
- [ ] ADR API-Versionierung entschieden + umgesetzt
- [ ] ADR SDK-Release entschieden + umgesetzt
- [ ] `engines.node` in SDK-package.json korrigiert (RF-1)
- [ ] Legacy-Globals aus Onboarding entfernt
- [ ] Demo-URL in README verlinkt
