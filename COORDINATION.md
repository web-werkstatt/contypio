# CMS Python - Sprint Status

**Stand:** 2026-03-06
**Production:** https://cms.ir-tours.de/
**Commit:** `2dd3a1b`

---

## Sprint L5b - DONE (komplett von Claude Code)

Codex-Workflow nach Runde 1 verworfen (falscher Pfad, falscher Scope).

### Runde 1 - Page Assembly (DONE)

| Task | Datei(en) | Status |
|------|-----------|--------|
| page_presets.py (7 Types, 11 Presets) | backend/app/services/page_presets.py | DONE |
| page_assembly.py (3 Endpoints) | backend/app/api/page_assembly.py | DONE |
| PageAssemblyWizard (4-Schritte) | frontend/src/components/PageAssemblyWizard.tsx | DONE |
| Types + AddBlockButton (15 Typen, 4 Kategorien) | frontend/src/types/cms.ts, .../AddBlockButton.tsx | DONE |
| Router + Build + Deploy | backend/app/main.py | DONE |

### Runde 2 - Travel Block Editoren (DONE)

| Task | Datei(en) | Status |
|------|-----------|--------|
| FeaturedTrips + TripListing + MagazineTeaser | frontend/.../editors/ | DONE |
| DestinationTiles + InspirationTiles + TrustStrip | frontend/.../editors/ | DONE |
| HeroSlider Editor | frontend/.../editors/ | DONE |
| BlockEditor Dispatcher (15 Types) | frontend/.../blocks/BlockEditor.tsx | DONE |
| Build + Deploy | - | DONE |

### Runde 3 - Auto-Fill + Preview (DONE)

| Task | Datei(en) | Status |
|------|-----------|--------|
| travel_api.py (httpx, host.docker.internal) | backend/app/services/travel_api.py | DONE |
| autofill.py API (trips, filters) | backend/app/api/autofill.py | DONE |
| preview.py API (Draft + Media) | backend/app/delivery/preview.py | DONE |
| Auto-Fill Button (FeaturedTrips) | frontend/.../FeaturedTripsEditor.tsx | DONE |
| Preview Panel (Desktop/Tablet/Mobile) | frontend/src/components/PreviewPanel.tsx | DONE |
| httpx + docker-compose + Deploy | diverse | DONE |

---

## Abgeschlossene Sprints

| Sprint | Status | Was |
|--------|--------|-----|
| L1 | DONE | Backend Core + DB + Auth |
| L2 | DONE | Pages + Media + Sections JSONB |
| L3 | DONE | Delivery API + Astro Renderer |
| L4 | DONE | Admin UI - Login + Seitenbaum |
| L5 | DONE | Section Editor + 8 Block-Editoren + Tiptap + MediaPicker |
| L5b | DONE | Page Assembly + 7 Travel Editoren + Auto-Fill + Preview |

## Naechste Sprints

| Sprint | Status | Was |
|--------|--------|-----|
| L6 | TODO | Media Library (Standalone-Seite, Bulk Upload, Kategorien) |
| L7 | TODO | Collections + Globals |
| L8 | TODO | Migration + Go-Live |

---

## Konventionen

### Datenmodell
```
Page -> sections[] -> Section -> columns[] -> Column -> blocks[] -> Block
```

### Alle Block-Typen (15 Stueck)
Content: `hero`, `richText`, `image`, `gallery`, `cards`, `cta`, `faq`, `newsletter`
Travel: `featuredTrips`, `tripListing`, `destinationTiles`, `inspirationTiles`
Marketing: `trustStrip`, `heroSlider`
Magazin: `magazineTeaser`

### ID-Generierung
- Backend: `f"sec_{uuid4().hex[:8]}"`
- Frontend: `nanoid(8)` mit Prefix (`sec_`, `col_`, `blk_`)
