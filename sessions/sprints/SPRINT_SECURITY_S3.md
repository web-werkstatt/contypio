# Security Sprint 3: Response-Security & Webhooks

**Erstellt:** 2026-03-15
**Status:** GEPLANT
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 3)
**Abhaengigkeit:** Security Sprint 2
**Geschaetzter Aufwand:** 4-5 Tage
**OWASP-Bezug:** API3:2023 BOPLA, API8:2023 Security Misconfiguration, API9:2023, API10:2023

---

## Ziel

Response-Inhalte absichern (BOPLA), Webhooks gegen Replay schuetzen, Search-Input sanitizen, Audit-Trail aufbauen.

---

## S8: Webhook Replay-Schutz

**Prioritaet:** Hoch
**Aufwand:** 3-4h
**Datei:** `backend/app/services/webhook_sender.py` (erweitern)

### Tasks

- [ ] **S8.1** Neue Security-Header in Webhook-Delivery
  - X-CMS-Timestamp: Unix-Timestamp der Signierung
  - X-CMS-Delivery-ID: UUID pro Delivery (Deduplizierung)
  - X-CMS-Signature-Version: 2
- [ ] **S8.2** Signatur-Format aendern: HMAC-SHA256(secret, "timestamp.body")
- [ ] **S8.3** Parallelbetrieb v1+v2 (8 Wochen, konfigurierbar pro Webhook-URL)
- [ ] **S8.4** Verifikations-Beispielcode in API-Referenz dokumentieren

### Akzeptanzkriterien
- Webhooks enthalten Timestamp + Delivery-ID
- Altes Signatur-Format (v1) laeuft 8 Wochen parallel
- Empfaenger kann Replay-Angriffe erkennen (Timestamp > 5min)

---

## S9: BOPLA-Audit (Response Field Filtering)

**Prioritaet:** Hoch
**Aufwand:** 6-8h
**Datei:** `backend/app/services/response_sanitizer.py`

### Tasks

- [ ] **S9.1** ResponseSanitizer Klasse erstellen
  - Global blocked: _internal, internal_notes, admin_notes, created_by, updated_by, draft_data, password, secret, api_key
  - Prefix-blocked: _internal*, _debug*, _admin*
  - Rekursive Filterung (dicts + lists)
- [ ] **S9.2** Collection-spezifische blocked fields (aus DB)
- [ ] **S9.3** Integration in alle Delivery-Endpoints
- [ ] **S9.4** CI-Test: audit_response() gegen alle Endpoints

### Akzeptanzkriterien
- Kein internes Feld in Delivery-API-Responses
- CI-Test prueft automatisch (BOPLA-Audit)
- Public Content bleibt unveraendert

---

## S10: Request-Logging / Audit-Trail

**Prioritaet:** Mittel
**Aufwand:** 3-4h
**Datei:** `backend/app/middleware/audit_log.py`

### Tasks

- [ ] **S10.1** AuditLogMiddleware erstellen
  - Logged: Method, Path, Status, Latenz, Client-IP, Key-Hint, Tenant
  - NICHT geloggt: Request/Response Bodies, Key-Klartext
  - JSON-Lines Format
- [ ] **S10.2** Alarmierung bei 401, 429, 5xx (Warning/Error Level)
- [ ] **S10.3** IP-Anonymisierung nach 7 Tagen (DSGVO)
- [ ] **S10.4** Log-Retention: 90 Tage

### Akzeptanzkriterien
- Alle Requests strukturiert geloggt
- Auth-Failures und Rate-Limits als Warnings
- DSGVO-konforme IP-Behandlung

---

## S11: Search-Input-Sanitization

**Prioritaet:** Hoch
**Aufwand:** 2-3h
**Datei:** `backend/app/validators/search_validator.py`

### Tasks

- [ ] **S11.1** SearchValidator Klasse erstellen
  - Max 200 Zeichen
  - Erlaubte Zeichen: alphanumerisch, Leerzeichen, Umlaute, Bindestriche, Punkt, Komma
  - Sonderzeichen entfernen statt ablehnen
- [ ] **S11.2** Integration in Collection-Endpoint (search Parameter)
- [ ] **S11.3** plainto_tsquery fuer sichere PostgreSQL-Konvertierung

### Akzeptanzkriterien
- Search-Input escaped und laengenbegrenzt
- SQL-Injection via Search nicht moeglich
- Umlaute und gaengige Sonderzeichen funktionieren

---

## Definition of Done

- [ ] Webhooks enthalten Timestamp + Delivery-ID
- [ ] Kein internes Feld in Delivery-API-Responses (CI-Test)
- [ ] Alle Requests strukturiert geloggt
- [ ] Search-Input escaped und laengenbegrenzt
