# Security Sprint 2: Key-Management & Rate Limiting

**Erstellt:** 2026-03-15
**Status:** GEPLANT
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 2)
**Abhaengigkeit:** Security Sprint 1
**Geschaetzter Aufwand:** 4-5 Tage
**OWASP-Bezug:** API2:2023 Broken Authentication, API4:2023 Unrestricted Resource Consumption

---

## Ziel

API-Key-Sicherheit auf State-of-the-Art bringen. Nach Sprint 2 werden Keys nur noch gehasht gespeichert, sind rotierbar, und haben differenzierte Rate Limits.

---

## S5: API-Key-Hashing (SHA-256)

**Prioritaet:** Hoch
**Aufwand:** 6-8h
**Dateien:** `backend/app/services/api_key_service.py`, DB-Migration

### Tasks

- [ ] **S5.1** APIKeyService Klasse erstellen
  - Key-Format: `cms_{type}_{32 random chars}` (z.B. cms_live_a1b2c3...)
  - SHA-256 Hash fuer DB-Lookup (deterministic, kein Salt)
  - key_hint: letzte 4 Zeichen fuer Admin-UI
  - key_type: "live" oder "build"
- [ ] **S5.2** DB-Migration: key_hash, key_hint, key_type, expires_at, revoked_at Spalten
- [ ] **S5.3** Bestehende Keys automatisch migrieren (einmalig hashen)
- [ ] **S5.4** Auth-Middleware auf Hash-Lookup umstellen
- [ ] **S5.5** Admin-UI: Key-Erstellung mit einmaligem Klartext-Display

### Akzeptanzkriterien
- Keine Klartext-Keys in der DB
- Hash-Verify Round-Trip funktioniert
- Bestehende Keys funktionieren nach Migration

---

## S6: Key-Rotation mit Grace Period

**Prioritaet:** Hoch
**Aufwand:** 4-6h
**Datei:** `backend/app/services/key_rotation.py`

### Tasks

- [ ] **S6.1** KeyRotationService implementieren
  - Neuer Key mit gleichen Scopes/Tenant
  - Alter Key: revoked_at = now + 24h (Grace Period)
  - Waehrend Grace Period: BEIDE Keys gueltig
- [ ] **S6.2** Admin-UI: [Rotate Key] Button mit Grace Period Anzeige
- [ ] **S6.3** Admin-UI: [Revoke Immediately] Button

### Akzeptanzkriterien
- Key-Rotation ueber Admin-UI mit 24h Grace Period
- Alter + neuer Key funktionieren waehrend Grace Period
- Nach Grace Period: alter Key wird abgelehnt

---

## S7: Key-Typen mit Tiered Rate Limits

**Prioritaet:** Kritisch (primaere Verteidigungslinie, Caddy hat kein RL)
**Aufwand:** 6-8h
**Datei:** `backend/app/middleware/rate_limiter.py`

### Tasks

- [ ] **S7.1** Token Bucket Rate Limiter implementieren
  - public (kein Key): 60 rpm, Burst 20
  - cms_live_: 120 rpm, Burst 30
  - cms_build_: 1000 rpm, Burst 100
- [ ] **S7.2** Bucket-Key: API-Key-Hash oder Client-IP (X-Forwarded-For)
- [ ] **S7.3** X-RateLimit-* Headers in jeder Response
- [ ] **S7.4** 429 Response mit Retry-After + RFC 7807
- [ ] **S7.5** Bestehenden rate_limit.py Middleware ersetzen

### Akzeptanzkriterien
- Drei Rate-Limit-Tiers funktional
- Rate-Limit-Headers in jeder Response
- Build-Keys erlauben 1000 rpm (SSG-Builds)
- In-Memory fuer Start, Redis-Adapter vorbereiten

---

## Definition of Done

- [ ] Keine Klartext-Keys mehr in der DB
- [ ] Key-Rotation ueber Admin-UI mit Grace Period
- [ ] Drei Rate-Limit-Tiers funktional (public/live/build)
- [ ] Rate-Limit-Headers in jeder Response
