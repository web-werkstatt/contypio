# Security Sprint 4: Tenant-Isolation & Audit

**Erstellt:** 2026-03-15
**Status:** GEPLANT
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 4)
**Abhaengigkeit:** Security Sprint 3
**Geschaetzter Aufwand:** 3 Tage
**OWASP-Bezug:** API1:2023 BOLA, API5:2023 BFLA

---

## Ziel

Sicherstellen, dass kein API-Key auf Daten eines anderen Tenants zugreifen kann — auch nicht durch Header-Manipulation.

---

## S12: Tenant-Isolation

**Prioritaet:** Hoch
**Aufwand:** 4-6h
**Datei:** `backend/app/middleware/tenant_isolation.py`

### Tasks

- [ ] **S12.1** TenantIsolationMiddleware erstellen
  - Regel: API-Key-Tenant MUSS mit resolved Tenant uebereinstimmen
  - Cross-Tenant-Versuch: 403 Forbidden + CRITICAL Log
  - Oeffentliche Requests (ohne Key): normale Tenant-Resolution
- [ ] **S12.2** X-Tenant-ID Response-Header fuer Debugging
- [ ] **S12.3** Middleware in main.py registrieren (innerste Schicht)

### Akzeptanzkriterien
- Cross-Tenant-Zugriff mit API-Key wird blockiert (403)
- Security-Alert bei Cross-Tenant-Versuch (CRITICAL Log)
- Oeffentliche Requests funktionieren weiterhin

---

## Penetration-Test: BOLA-Szenarien

**Aufwand:** 4h

### Tasks

- [ ] **PT.1** ID-Manipulation: Collection-Item-IDs eines anderen Tenants
- [ ] **PT.2** Key-Scope-Bypass: Key fuer Collection A, Zugriff auf Collection B
- [ ] **PT.3** Header-Manipulation: X-Tenant mit fremdem Tenant + eigenem Key
- [ ] **PT.4** Slug-Enumeration: Seiten-Slugs eines anderen Tenants raten

### Akzeptanzkriterien
- Alle 4 Szenarien werden korrekt blockiert
- Keine Daten-Leaks zwischen Tenants

---

## Security-Dokumentation

**Aufwand:** 4h

### Tasks

- [ ] **DOC.1** Security-Abschnitt in docs/api-reference.md
  - CORS-Konfiguration
  - API-Key-Typen und Scopes
  - Rate Limiting Tiers
  - Webhook-Verifikation (v2 Signatur-Beispiel)
- [ ] **DOC.2** SECURITY.md im Repo-Root
  - OWASP API Security Top 10 Referenz
  - HTTP Security Header Cheat Sheet Referenz
  - Responsible Disclosure Policy

### Akzeptanzkriterien
- Security-Abschnitt in API-Referenz vollstaendig
- SECURITY.md vorhanden und verlinkt

---

## Definition of Done

- [ ] Cross-Tenant-Zugriff wird zuverlaessig blockiert
- [ ] Penetration-Tests bestanden (4 Szenarien)
- [ ] Security-Dokumentation vollstaendig
- [ ] SECURITY.md im Repo
