# Security Sprint 2: Key-Management & Rate Limiting

**Erstellt:** 2026-03-15
**Status:** DONE (Session 3)
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 2)
**OWASP-Bezug:** API2:2023 Broken Authentication, API4:2023 Unrestricted Resource Consumption

---

## Ziel

API-Key-Sicherheit auf State-of-the-Art. Keys gehasht, rotierbar, mit differenzierten Rate Limits.

---

## S5: API-Key-Hashing (SHA-256) — DONE (Session 2)

Bereits implementiert: SHA-256 Hash, kein Klartext in DB, `key_prefix` fuer Admin-UI.
- `backend/app/auth/api_key.py`: `hash_api_key()`, `generate_api_key()`

## S6: Key-Rotation mit Grace Period — DONE

- `POST /api/api-keys/{id}/rotate?grace_hours=24`
- Alter Key → `rotated_key_hash`, Grace Period via `rotation_expires_at`
- Auth prueft primary + rotated hash (waehrend Grace Period)
- **Dateien:** `backend/app/auth/api_key.py`, `backend/app/api/api_keys.py`, `backend/app/delivery/collections.py`

## S7: Tiered Rate Limits — DONE

- `key_type` auf CmsApiKey: `"live"` (default) | `"build"`
- Limits: public=100/min, live=500/min, build=2000/min
- `X-RateLimit-Tier` Header in Responses
- Sliding-window Counter (in-memory)
- **Datei:** `backend/app/core/rate_limit.py`

## Migration

- `backend/migrations/versions/002_security_sprint2.py`
- Neue Spalten: `key_type`, `rotated_key_hash`, `rotation_expires_at`

---

## Definition of Done

- [x] Keine Klartext-Keys in der DB
- [x] Key-Rotation ueber Admin-API mit Grace Period
- [x] Drei Rate-Limit-Tiers funktional (public/live/build)
- [x] Rate-Limit-Headers in jeder Response
- [x] Alembic Migration erstellt
