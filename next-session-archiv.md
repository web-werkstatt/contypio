# Session-Archiv - Contypio CMS

> Archivierte Session-Eintraege aus next-session.md

---

## Session 21.03.2026 (Session 6) — Vite 8 Upgrade + Webstudio-Konzept

Letzte Planung vor Session 7. Prioritaeten waren API-Versionierung, Englische Docs, Frontend-Luecken, Tests, Astro Starter.

---

## Session 2026-03-21 — Infrastruktur-Upgrades + Webstudio-Konzept

### Was wurde erledigt
- Vite 7→8 Upgrade + @vitejs/plugin-react 5→6 (manualChunks Breaking Change gefixt)
- PostgreSQL Alpine→Debian mit ICU locale-provider=und (sprachneutral)
- ICU Collations Init-Script (de-DE, en-US, fr-FR, es-ES, tr-TR)
- Webstudio-Integration Konzept erstellt (docs/webstudio-integration.md)
  - CSS→Tailwind Parser (css-to-tailwindcss) als gekapselte Library
  - Schema-driven Block-Mapping (transparent fuer Enduser)
  - Astro-Starter als Converter-Basis
- Issues #13 (Setup-Wizard) + #14 (Webstudio-PoC) eingeplant
- CLAUDE.md bereinigt (PostgreSQL-Duplikat entfernt)

### Git Commits
```
97f7e22 chore: Vite 8 Upgrade, PostgreSQL Debian+ICU, Webstudio-Konzept
```

---

## Session 5 (2026-03-15) — Schema-Endpoint + Depth Control + Importer

### Was wurde erledigt
- Schema-Endpoint (Issue #6): GET /content/schema, GET /content/schema/{key}
- Depth Control (Issue #7): ?depth=0..5 auf allen Delivery-Endpoints
- HTML-Importer Rewrite: Multi-Column, Tailwind Grids, Noise-Removal
- Selektiver Section-Import + Apply-Endpoint
- README aktualisiert (Security-Tabelle, Batch-API)
- Astro Frontend Update: Node 22, Astro 6, Tailwind 4

### Git Commits
```
b5e864a feat: Selektiver Section-Import + Apply-Endpoint + Noise-Removal
8b9c87c fix: Importer erkennt Multi-Column Layouts, Tailwind Grids, Team-Galleries
025ac27 feat: Schema-Endpoint (#6) + Depth Control (#7) — Phase 3 Features
595a6e1 docs: README aktualisiert — Security-Tabelle, Batch-API, Single-Container-Architektur
```
