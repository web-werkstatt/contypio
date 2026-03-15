# Security Sprint 1: Infrastruktur-Baseline

**Erstellt:** 2026-03-15
**Status:** DONE
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 1)
**Geschaetzter Aufwand:** 2-3 Tage
**OWASP-Bezug:** API8:2023 Security Misconfiguration, API1:2023 BOLA, API3:2023 BOPLA

---

## Ziel

Alle Quick Wins implementieren, die ohne Schema-Aenderungen oder Breaking Changes moeglich sind. Nach Sprint 1 erfuellt die API die grundlegenden Transport- und Konfigurations-Security-Anforderungen.

---

## S1: Security Response Headers

**Prioritaet:** Kritisch
**Aufwand:** 1-2h
**Datei:** `backend/app/middleware/security_headers.py`

### Tasks

- [ ] **S1.1** SecurityHeadersMiddleware erstellen
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
  - Referrer-Policy: no-referrer
  - Permissions-Policy: geolocation=(), microphone=(), camera=()
  - X-Permitted-Cross-Domain-Policies: none
  - Cross-Origin-Opener-Policy: same-origin
  - Cross-Origin-Resource-Policy: same-origin
- [ ] **S1.2** Middleware in main.py registrieren
- [ ] **S1.3** Test: `curl -I` zeigt alle Header

### Akzeptanzkriterien
- Alle 8 Security-Headers in jeder Response vorhanden
- Kein Impact auf bestehende Funktionalitaet

---

## S2: HTTPS/HSTS Enforcement (Defense-in-Depth)

**Prioritaet:** Defense-in-Depth (Caddy uebernimmt primaer)
**Aufwand:** 1-2h
**Datei:** `backend/app/middleware/https_enforcement.py`

### Tasks

- [ ] **S2.1** HTTPSEnforcementMiddleware erstellen
  - X-Forwarded-Proto Header auswerten (Caddy setzt diesen)
  - HTTP -> HTTPS Redirect (301) wenn ENFORCE_HTTPS=true
  - HSTS Header setzen wenn scheme=https
- [ ] **S2.2** ENFORCE_HTTPS Setting in config.py (Default: True, False fuer Dev)
- [ ] **S2.3** Middleware in main.py registrieren (aeusserste Schicht)

### Akzeptanzkriterien
- In Production: HTTP-Requests werden zu HTTPS redirected (Fallback zu Caddy)
- Lokal (ENFORCE_HTTPS=false): Kein Redirect
- HSTS-Header wird nur ueber HTTPS gesetzt

---

## S3: CORS-Konfiguration pro Tenant

**Prioritaet:** Kritisch
**Aufwand:** 4-6h
**Dateien:** `backend/app/middleware/tenant_cors.py`, DB-Migration

### Tasks

- [ ] **S3.1** Bestehende CORSMiddleware durch TenantAwareCORSMiddleware ersetzen
  - Origins pro Tenant aus DB laden
  - Default: deny all (keine Origins erlaubt)
  - Preflight (OPTIONS) ohne Auth behandeln
  - Vary: Origin Header setzen
- [ ] **S3.2** CmsTenant Model erweitern: `cors_origins` (JSON-Array), `cors_max_age` (int, default 86400)
- [ ] **S3.3** Middleware in main.py registrieren (vor Auth, nach Security Headers)

### Akzeptanzkriterien
- CORS nur fuer konfigurierte Origins
- Preflight Requests funktionieren ohne API-Key
- Server-zu-Server Requests (ohne Origin) sind nicht betroffen
- Default: deny all

---

## S4: Filter-Field-Allowlist

**Prioritaet:** Kritisch
**Aufwand:** 4-6h
**Datei:** `backend/app/validators/filter_validator.py`

### Tasks

- [ ] **S4.1** FilterValidator Klasse erstellen
  - GLOBAL_ALLOWED: {status, title, slug, created_at, updated_at}
  - MAX_DEPTH: 3 (data.category.name = 3 Ebenen)
  - MAX_FILTERS: 10 pro Request
  - ALLOWED_OPERATORS: {eq, ne, gt, gte, lt, lte, contains, in}
- [ ] **S4.2** Collection-spezifische Allowlist (aus Schema `filterable_fields`)
- [ ] **S4.3** Integration in Collections-Endpoint: Filter validieren vor DB-Query
- [ ] **S4.4** RFC 7807 Fehler bei nicht-erlaubten Feldern/Operatoren

### Akzeptanzkriterien
- Nur erlaubte Felder koennen gefiltert werden
- Unbekannte Felder: 400 Bad Request mit klarer Fehlermeldung
- Bestehende Filter funktionieren weiterhin (Allowlist initial grosszuegig)
- Max 10 Filter pro Request

---

## Reihenfolge

```
1. S1 Security Headers      (1-2h, kein Risiko)
2. S2 HSTS Enforcement      (1-2h, kein Risiko)
3. S4 Filter Allowlist       (4-6h, potenziell Breaking)
4. S3 Tenant CORS            (4-6h, braucht DB-Feld)
```

S1+S2 zuerst weil risikofrei. S4 vor S3 weil S3 ein neues DB-Feld braucht.

---

## Definition of Done

- [ ] Alle Security-Headers in jeder Response
- [ ] HSTS via FastAPI-Middleware als Fallback (Caddy uebernimmt primaer)
- [ ] CORS nur fuer konfigurierte Origins
- [ ] Filter nur auf erlaubte Felder moeglich
- [ ] Alle bestehenden Endpoints funktionieren weiterhin
