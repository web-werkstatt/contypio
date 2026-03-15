# Security Sprint 3: Response-Security & Webhooks

**Erstellt:** 2026-03-15
**Status:** DONE (Session 3)
**Referenz:** docs/api-roadmap-v1.md (Teil 2, Sprint 3)
**OWASP-Bezug:** API3:2023 BOPLA, API8:2023, API9:2023, API10:2023

---

## S8: Webhook Replay-Schutz — DONE

- Signatur v2: `HMAC-SHA256(secret, "timestamp.body")` statt `HMAC-SHA256(secret, body)`
- `X-Contypio-Timestamp` Header fuer Replay-Erkennung (Empfaenger prueft: timestamp < 5min)
- `X-Contypio-Signature: v2=...` + `X-Contypio-Event`
- **Datei:** `backend/app/services/webhook_service.py`

## S9: BOPLA-Audit — DONE

- Delivery-Responses werden manuell gebaut (explizites Feld-Mapping) — keine internen Felder
- `strip_internal_fields()` Utility als zusaetzliche Sicherheitsebene
- Blocklist: tenant_id, created_by, updated_by, deleted_at, hashed_password, key_hash
- **Datei:** `backend/app/delivery/query_params.py`

## S10: Audit-Log — DONE

- `AuditLogMiddleware` loggt alle mutierenden Admin-API-Requests (POST/PUT/PATCH/DELETE)
- Format: AUDIT method path → status (duration) user=X tenant=Y ip=Z
- Delivery-Reads werden nicht geloggt (zu viel Noise)
- DSGVO: IP wird geloggt, Retention/Anonymisierung via Log-Rotation
- **Datei:** `backend/app/middleware/audit_log.py`

## S11: Search-Input-Sanitization — DONE

- LIKE-Wildcards (`%`, `_`) in Search-Input escaped
- Verhindert Pattern-Injection ueber ?search= Parameter
- **Datei:** `backend/app/delivery/collections.py`

---

## Definition of Done

- [x] Webhooks: Timestamp-basierte Signatur v2
- [x] BOPLA: Keine internen Felder in Delivery-Responses
- [x] Audit-Log: Admin-API Mutations geloggt
- [x] Search: Input sanitized gegen LIKE-Injection
