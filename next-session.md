# Next Session - Contypio CMS

**Stand:** 26.03.2026 (nach Session 7)
**Letzter Commit:** Session 7 — Singleton Collections + Schema Editor + GUI
**Branch:** main
**Repo:** https://git.webideas24.com/webideas24/contypio
**Production (Referenz):** https://cms.ir-tours.de (Admin) + Delivery API
**Landing Page:** https://headless-cms.webideas24.com/ (auto-generiert)
**Issues:** https://git.webideas24.com/webideas24/contypio/issues

---

## Session 7 — Was wurde gemacht

### Singleton Collections (Directus-Pattern)
- `singleton: true` Flag am Collection-Schema (Model + Migration + Pydantic + TypeScript)
- Backend: `GET/PUT /api/collections/{key}/item` Endpoints, Guard bei create_item
- Delivery API: `/content/globals/` liest aus Singleton-Collections, Fallback auf Legacy cms_globals
- Seed: site-settings, social-media, navigation als Singleton-Schemas + Items
- Frontend: Singleton-Modus zeigt Formular statt Liste
- **Deployed auf Production, Migration 004_singleton gelaufen**

### Schema Editor Slide-over
- Neue Komponente `SchemaSlideOver.tsx` (420px Panel von rechts)
- Feld-Liste mit Sortierung, Detail-Panel mit Label/Key/Typ/Pflicht
- Typ-spezifische Extras (Optionen, Relations, Min/Max)
- Validierungsregeln (minLength, maxLength, pattern, custom)
- `validations` Feld an FieldDef (Backend + Frontend)

### Navigation vereinfacht
- Sidebar: "Daten" statt "Collections", Singletons + Collections zusammen
- Farbige Icons: Teal fuer Listen, Orange fuer Formulare
- Type-Badges: "Liste" / "Formular"
- Settings-Routes fuer general/social-media entfernt (jetzt unter Daten)
- Settings behaelt nur: Navigation, Webhooks, API-Keys, Import, Module

### Rollen-Check
- Schema-Button in Sidebar: nur Admin
- "Felder verwalten" Button: nur Admin
- "+ Neue Collection": nur Admin
- Settings-Link: nur Admin
- Schema Sub-Navigation: nur Admin

### GUI Polish
- Content Templates (3 Dateien) auf Design-System umgestellt
- `blue-600` → `var(--primary)`, `dark:` Klassen entfernt

### Dokumentation erstellt
- `dokumentenaustausch/contypio-tech-stack.md` — vollstaendiger Tech Stack
- `dokumentenaustausch/contypio-roadmap-2026.md` — 3-Stufen-Roadmap
- `dokumentenaustausch/contypio-navigationskonzept.html` — GUI-Konzept
- `sessions/sprints/SPRINT_IRTOURS_GOLIVE.md` — IR-Tours Go-Live Sprint
- `sessions/sprints/SPRINT_SCHEMA_EDITOR_SLIDEOVER.md` — Schema Editor Sprint
- Competitive Analysis Memory gespeichert

---

## Naechste Session — Prioritaeten

### 1. IR-Tours Go-Live Content — HIGH
- site-settings befuellen (Firma, Logo, Adresse, Telefon)
- social-media befuellen (Instagram, Facebook etc.)
- Navigation Global befuellen
- Rechtsseiten anlegen (AGB, Datenschutz, Impressum)
- Fehlende Seiten: /reiseziele/suedamerika, /br-reisen Hero

### 2. Dashboard verbessern — MEDIUM
- Schnellzugriff-Widget (Seiten, Daten, Media)
- "Zuletzt bearbeitet" Liste
- Statistiken (Seiten, Eintraege, Medien)
- Onboarding nur beim ersten Login (`user.hasSeenOnboarding`)

### 3. Alten Globals-Code entfernen — LOW
- Task 1.7: CmsGlobal Model, GlobalEditor, SocialMediaEditor entfernen
- Erst wenn Singleton-Migration auf Production verifiziert ist
- Delivery-API Fallback-Logik kann dann auch weg

### 4. Offene Items aus Roadmap
- Revisions-UI (Stufe 2)
- RBAC-UI (Stufe 2)
- Audit-Log UI (Stufe 2, Backend fertig)
- API Playground (Stufe 1, FastAPI hat es eingebaut)

---

## Deployment

```bash
# Production (IR-Tours)
./infrastructure/deploy/deploy.sh sync backend     # Python Code (~5s)
./infrastructure/deploy/deploy.sh sync frontend    # React Build (~30s)
./infrastructure/deploy/deploy.sh sync all         # Beides
./infrastructure/deploy/deploy.sh health           # Health-Check
```

**Server:** 176.9.1.186 (pve3) → Docker-VM 10.10.10.100 (SSH: `irtours-docker`)

---

## Gitea Issues

| # | Issue | Priority | Phase | Status |
|---|-------|----------|-------|--------|
| ~~#1~~ | ~~Content i18n~~ | ~~critical~~ | ~~Phase 1~~ | **DONE** |
| ~~#2~~ | ~~Security Sprint 2~~ | ~~critical~~ | ~~Phase 2~~ | **DONE** |
| ~~#3~~ | ~~Security Sprint 3~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#4~~ | ~~Security Sprint 4~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#5~~ | ~~Batch-Format-Umbau~~ | ~~high~~ | ~~Phase 2~~ | **DONE** |
| ~~#6~~ | ~~Schema-Endpoint~~ | ~~medium~~ | ~~Phase 3~~ | **DONE** |
| ~~#7~~ | ~~Depth Control~~ | ~~medium~~ | ~~Phase 3~~ | **DONE** |
| #8 | API-Versionierung | medium | Phase 3 | TODO |
| #9 | Englische Docs | high | Phase 3 | teilweise |
| #10 | Astro Starter | medium | — | TODO |
| #11 | GraphQL-Layer | medium | v2 | TODO |
| #12 | SOC-2 Vorbereitung | medium | v2 | TODO |
| #13 | Setup-Wizard (Web GUI) | medium | Launch | TODO |
| #14 | Webstudio-PoC (Design-Tool) | medium | Launch | TODO |

**Erledigt:** 7 von 14 Issues

---

## Wichtige neue Dateien (Session 7)

| Datei | Beschreibung |
|-------|-------------|
| `backend/migrations/versions/004_collection_singleton.py` | Alembic: singleton Feld |
| `frontend/src/components/collections/SchemaSlideOver.tsx` | Schema Editor Slide-over Panel |
| `dokumentenaustausch/contypio-tech-stack.md` | Vollstaendiger Tech Stack |
| `dokumentenaustausch/contypio-roadmap-2026.md` | 3-Stufen Produkt-Roadmap |
| `dokumentenaustausch/contypio-navigationskonzept.html` | GUI-Konzeptdokument |
