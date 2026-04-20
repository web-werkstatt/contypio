# Contypio – Sprintplan für Astro Go-Live

**Stand:** 20.04.2026  
**Ziel:** operative Reihenfolge mit Aufwand und Fokus

## Sprint 1 – Technische Basis festziehen

**Ziel:** Support-Matrix, Zielversionen und Integrationsvertrag sauber definieren.

### Aufgaben

1. Support-Matrix veröffentlichen
2. Python-Zielversion festlegen
3. Astro-Consumption-Path definieren
4. offene API-Risiken dokumentieren

### Aufwand

- **0.5 bis 1 Tag**

### Ergebnis

- klare technische Leitplanken

## Sprint 2 – Astro Starter MVP

**Ziel:** ersten lauffähigen Astro-Starter bereitstellen.

### Aufgaben

1. `starters/astro/` anlegen
2. Astro 6.1 konfigurieren
3. SDK einbinden
4. `index.astro` und `[...slug].astro` bauen
5. Block-/Section-Renderer MVP bauen

### Aufwand

- **2 bis 4 Tage**

### Ergebnis

- lauffähiger Starter

## Sprint 3 – Referenzintegration

**Ziel:** End-to-End-Beweis mit echtem Content.

### Aufgaben

1. Demo-Tenant oder Demo-Content anbinden
2. Globals im Layout verwenden
3. 4-6 Blocktypen stabil rendern
4. Build und Routing verifizieren

### Aufwand

- **2 bis 3 Tage**

### Ergebnis

- belastbare Astro-Demo

## Sprint 4 – Produktisierung für Entwickler

**Ziel:** Astro-Nutzer sollen Contypio ohne Reibung starten können.

### Aufgaben

1. Astro Quickstart schreiben
2. Starter README schreiben
3. Known limitations dokumentieren
4. SDK-Verwendung sauber dokumentieren

### Aufwand

- **1 bis 2 Tage**

### Ergebnis

- gute Developer Experience

## Sprint 5 – Governance und Stabilität

**Ziel:** Launch tragfähig absichern.

### Aufgaben

1. CI für SDK + Astro-Starter
2. API-Versionierung vorbereiten oder implementieren
3. Legacy-Globals / Singleton-Bruch im Onboarding reduzieren

### Aufwand

- **2 bis 4 Tage**

### Ergebnis

- launchfähigere Architektur

## Empfohlene Reihenfolge

1. Sprint 1
2. Sprint 2
3. Sprint 3
4. Sprint 4
5. Sprint 5

## Gesamtschätzung

- **7.5 bis 14 Tage**

Je nach vorhandener Demo-Basis und ob API-Versionierung nur dokumentiert oder direkt implementiert wird.
