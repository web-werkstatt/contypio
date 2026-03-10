# CLAUDE.md - Contypio Project

## Projekt

Contypio ist ein Headless CMS (SaaS). Dieses Repo enthält die **öffentlichen** Komponenten:
- `packages/contypio-client/` — TypeScript SDK (`@contypio/client`)
- `starters/astro/` — Astro Starter Template

Der proprietäre CMS-Backend-Code liegt in `proj_irtours/cms-python/`.

## Session-Start Checklist

1. `sessions/sprints/` lesen (aktuelle Sprint-Pläne)
2. Prüfen welche Aufgaben offen sind

## Architektur

| Komponente | Beschreibung |
|---|---|
| `@contypio/client` | TypeScript SDK für die Delivery API (read-only, kein Auth) |
| Astro Starter | Referenz-Frontend mit 6 Block-Komponenten + dynamischem Routing |
| Delivery API | Läuft in `proj_irtours/cms-python/` — Endpoints: `/content/page`, `/content/tree`, `/content/collection/{key}`, `/content/globals/` |

## Code Standards

- TypeScript strict, kein `any`
- ESM only (`"type": "module"`)
- Zero Runtime-Dependencies im SDK (nur native fetch)
- Englische Texte (internationaler GitHub-Launch)
- Astro 4.x + Tailwind CSS im Starter
- SSG-Modus (Static Site Generation) als Default

## Kommunikation

- KEINE Marketing-Sprache
- NUR Fakten, Status, Zahlen
