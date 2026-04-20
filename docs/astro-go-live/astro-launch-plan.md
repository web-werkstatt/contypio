# Contypio + Astro 6.1 – Launch Plan

**Stand:** 20.04.2026  
**Ziel:** Contypio in einen Zustand bringen, in dem es unter Astro als ernstzunehmendes Headless CMS veröffentlicht werden kann

## 1. Launch-Ziel

Am Ende dieses Plans soll Contypio liefern:

- einen funktionierenden Astro-6.1-Starter
- einen dokumentierten Quickstart
- eine belastbare Versionen-Matrix
- ein nachvollziehbares Demo-/Referenzsetup
- eine glaubwürdige Positionierung für Astro-Nutzer

## 2. Phase 1 – Foundations

### Ziel

Die technische Basis für Astro eindeutig definieren.

### Aufgaben

1. Unterstützte Versionen festlegen
   - Node: `22.12.0+`
   - Python: Zielversion festlegen, ideal `3.13.x` oder nach Prüfung `3.14.x`
   - TypeScript: `5.9.x` zunächst stabil halten, `6.0` separat prüfen

2. Astro-Consumption-Vertrag definieren
   - welche Endpunkte nutzt der Starter
   - welches Response-Format ist stabil
   - welche Blocktypen werden zuerst unterstützt

3. API-Stabilitätsrisiken markieren
   - insbesondere ohne `/api/v1/content/...`

### Ergebnis

- klare Support-Matrix
- klare Astro-Schnittstelle

## 3. Phase 2 – Astro Starter bauen

### Ziel

Ein echtes `starters/astro/` bereitstellen.

### Mindestumfang

- `package.json`
- `astro.config.mjs`
- `src/pages/index.astro`
- `src/pages/[...slug].astro`
- `src/components/SectionRenderer.astro`
- `src/components/BlockRenderer.astro`
- mehrere Block-Komponenten
- Nutzung von `@contypio/client`

### Ergebnis

- lokaler `npm install`
- `npm run dev`
- `npm run build`

## 4. Phase 3 – Referenzintegration

### Ziel

Einen echten End-to-End-Nachweis für Astro + Contypio schaffen.

### Aufgaben

1. Demo-Tenant / Demo-Content verwenden
2. Page Tree in Astro zu `getStaticPaths` verdrahten
3. Globals in Layout integrieren
4. 4-6 reale Blocktypen rendern
5. Fehlerfälle dokumentieren

### Ergebnis

- lauffähige Demo
- belastbarer Beweis für die Astro-Kompatibilität

## 5. Phase 4 – Doku und Developer Experience

### Ziel

Astro-Nutzer sollen Contypio ohne Rückfragen starten können.

### Aufgaben

1. Astro Quickstart schreiben
2. SDK + Astro Beispiel dokumentieren
3. unterstützte Versionen dokumentieren
4. Deploy-Empfehlungen dokumentieren
5. „Known limitations“ ergänzen

### Ergebnis

- astro-taugliche Launch-Dokumentation

## 6. Phase 5 – Launch Readiness

### Ziel

Außenwirksame Veröffentlichung vorbereiten.

### Aufgaben

1. CI für SDK + Astro-Starter
2. API-Versionierungsstrategie mindestens dokumentieren, besser implementieren
3. Referenz-Repo oder Demo-Video bereitstellen
4. Positionierungstext für Astro-Community formulieren

### Ergebnis

- Contypio kann seriös als Astro-Headless-CMS vorgestellt werden

## 7. Empfohlene Reihenfolge

1. Support-Matrix definieren
2. Astro-Starter bauen
3. Demo integrieren
4. Doku vervollständigen
5. CI und API-Governance nachziehen

## 8. Realistische Go-Live-Bewertung

### Kurz gesagt

Contypio ist heute **astro-kompatibel in der Architektur**, aber noch **nicht launch-fertig für das Astro-Ökosystem**.

### Für einen glaubwürdigen Astro-Go-Live müssen mindestens diese Punkte stehen

1. echter Starter
2. verifizierter Build mit Astro 6.1
3. Referenzdemo
4. Versionen-Dokumentation
5. SDK + Doku + CI

## 9. Quellen

- Astro 6.1: https://astro.build/blog/astro-610/
- Astro v6 Upgrade Guide: https://docs.astro.build/en/guides/upgrade-to/v6/
- Astro Releases: https://github.com/withastro/astro/releases
- Next.js 16 Upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16
- TypeScript 6.0: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- Python latest stable: https://www.python.org/downloads/latest/
