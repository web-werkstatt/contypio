# Sprint: System-Luecken schliessen

**Erstellt:** 15.03.2026 (Session 3)
**Status:** IN PROGRESS

---

## Kritisch

| # | Luecke | Status |
|---|--------|--------|
| G1 | Deploy-Script synct keine Migrations | DONE — auto-sync + alembic upgrade in deploy.sh |
| G2 | SEED_DEMO nicht implementiert | DONE — seed_demo.py + Lifespan-Integration |
| G3 | Keine Tests | DONE — 53 Tests (i18n, BOPLA, rate limits, sort, filter, cache, RFC7807) |

## Hoch

| # | Luecke | Status |
|---|--------|--------|
| G4 | Kein CI/CD Pipeline | TODO |
| G5 | Kein DB-Backup | DONE — deploy.sh backup Command |
| G6 | Frontend nginx.conf divergiert | KEIN BUG — Production nutzt eigene Config (irtours-cms), Self-Hosted nutzt api |
| G7 | SDK nicht auf npm published | TODO |

## Mittel (Roadmap)

| # | Luecke | Issue |
|---|--------|-------|
| G8 | Schema-Endpoint | #6 |
| G9 | Depth Control | #7 |
| G10 | API-Versionierung | #8 |
| G11 | Englische Docs (Rest) | #9 |
| G12 | Astro Starter | #10 |
