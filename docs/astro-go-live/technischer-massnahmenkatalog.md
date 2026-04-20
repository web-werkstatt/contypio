# Contypio – Technischer Maßnahmenkatalog pro Datei / Modul

**Stand:** 20.04.2026  
**Ziel:** konkrete technische Arbeitspakete für den Astro-Go-Live

## 1. `starters/astro/`

**Status:** derzeit nicht belastbar im Repo nachweisbar

### Maßnahmen

- `package.json` anlegen
- `astro.config.mjs` anlegen
- `.env.example` anlegen
- `src/pages/index.astro` anlegen
- `src/pages/[...slug].astro` anlegen
- `src/layouts/BaseLayout.astro` anlegen
- `src/components/BlockRenderer.astro` anlegen
- `src/components/SectionRenderer.astro` anlegen
- erste Block-Komponenten anlegen

## 2. `packages/contypio-client/`

**Status:** stark, aber für Astro noch nicht mit echtem Starter verifiziert

### Maßnahmen

- SDK im Astro-Starter real konsumieren
- Astro-spezifische README-Beispiele gegen echten Starter abgleichen
- optional Engines/Peer-Kommunikation schärfen
- Release-/Publish-Prozess definieren

### Relevante Dateien

- `packages/contypio-client/package.json`
- `packages/contypio-client/README.md`
- `packages/contypio-client/src/resources/pages.ts`
- `packages/contypio-client/src/resources/collections.ts`
- `packages/contypio-client/src/fetch.ts`

## 3. `backend/app/delivery/*`

**Status:** gute Basis, aber ohne API-Versionierung

### Maßnahmen

- Versionierungsstrategie für Delivery API umsetzen
- Response-Formate für Astro-Starter bewusst festziehen
- Doku gegen tatsächliche Response-Formate abgleichen

### Relevante Dateien

- `backend/app/delivery/pages.py`
- `backend/app/delivery/collections.py`
- `backend/app/delivery/globals.py`
- `backend/app/delivery/schema.py`
- `backend/app/main.py`

## 4. `backend/app/api/tenants.py`

**Status:** Onboarding vorhanden, aber noch mit Legacy-Globals

### Maßnahmen

- Onboarding auf Singleton-Collections ausrichten
- Legacy-Globals-Seed aus dem Onboarding entfernen
- neuen Tenant-Flow mit Zielarchitektur synchronisieren

## 5. `backend/app/services/seed_collections.py`

**Status:** gemischter Seed-Stand zwischen Singleton und Legacy

### Maßnahmen

- Legacy-Globals-Seed zurückbauen
- Singleton-Seed als primären Pfad festziehen
- Seeder-Dokumentation aktualisieren

## 6. `backend/app/api/globals.py` und `backend/app/models/global_config.py`

**Status:** Legacy noch vorhanden

### Maßnahmen

- prüfen, ob noch produktiv benötigt
- nach erfolgreicher Migration entfernen oder klar als Übergangspfad markieren

## 7. `docs/astro-go-live/*`

**Status:** Analyse und Planung vorhanden

### Maßnahmen

- nach jeder Astro-Implementierungsphase aktualisieren
- Support-Matrix als offizielle Referenz pflegen
- Starter-Quickstart ergänzen

## 8. CI / Repo-Root

**Status:** sichtbar nicht vorhanden

### Maßnahmen

- Workflow-Dateien anlegen
- SDK-Typecheck integrieren
- Frontend-Lint integrieren
- Astro-Starter-Build integrieren

## 9. Empfohlene Umsetzungsreihenfolge

1. `starters/astro/`
2. SDK + Starter zusammen
3. Delivery API / Versionierung
4. Onboarding + Seeds
5. CI
6. Legacy-Cleanup
