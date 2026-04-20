# ADR: API-Versionierungsstrategie für Delivery API #sprint-adr-api-versionierungsstrategie-f-r-delivery-api

**Status:** OFFEN – Entscheidung erforderlich bis Ende Sprint 1
**Stand:** 20.04.2026
**Autor:** –
**Entscheider:** –

---

## Kontext

Die Delivery API (`/content/pages`, `/content/collections`, `/content/globals`, etc.) ist aktuell ohne Versionspräfix eingebunden. Alle Router in `backend/app/main.py` werden direkt ohne `/v1/`-Prefix registriert.

Für einen öffentlichen Astro-Go-Live bedeutet das: Jede Breaking Change in der API bricht alle bestehenden Starter-Installationen ohne Vorwarnung.

**Betroffene Dateien im Code:**
- `backend/app/main.py` (Router-Registrierung, Zeilen 216–245)
- `backend/app/delivery/pages.py`
- `backend/app/delivery/collections.py`
- `backend/app/delivery/globals.py`
- `packages/contypio-client/src/client.ts` (Basis-URL)
- `packages/contypio-client/src/fetch.ts`

---

## Optionen

### Option A – `/api/v1/`-Präfix implementieren #spec-option-a-api-v1-pr-fix-implementieren

**Was:** Alle Delivery-Router unter `/api/v1/content/...` einbinden.

**Wie:**
```python
# backend/app/main.py
app.include_router(delivery_router, prefix="/api/v1")
app.include_router(delivery_collections_router, prefix="/api/v1")
app.include_router(delivery_globals_router, prefix="/api/v1")
app.include_router(delivery_locales_router, prefix="/api/v1")
app.include_router(delivery_schema_router, prefix="/api/v1")
```

SDK-Basis-URL in `client.ts` entsprechend anpassen.

**Aufwand:** 3–5 Stunden (Code + SDK + Tests)

**Vorteile:**
- Sauberer Vertrag für externe Nutzer
- Breaking Changes in `/v2/` ohne Legacy-Bruch möglich
- Glaubwürdige Ecosystem-Positionierung

**Nachteile:**
- Bestehende Installationen (falls vorhanden) müssen URLs anpassen
- SDK muss neue Basis-URL kennen

**Empfehlung:** Wähle diese Option wenn Contypio ernsthaft als Ecosystem-Player positioniert werden soll.

---

### Option B – Kein Präfix, Changelog-Commitment #spec-option-b-kein-pr-fix-changelog-commitment

**Was:** Bestehende URLs bleiben. Verbindliche Zusage: keine Breaking Changes ohne Ankündigung + CHANGELOG-Eintrag + Migrationspfad.

**Wie:**
- `CHANGELOG.md` anlegen
- Breaking-Change-Policy in Dokumentation schreiben
- „Stability: beta" im Quickstart vermerken

**Aufwand:** 1–2 Stunden (Dokumentation)

**Vorteile:**
- Kein Code-Umbau notwendig
- Schneller Launch

**Nachteile:**
- Kein formaler Vertrag – Nutzer vertrauen einem Versprechen, keiner API-Struktur
- Erschwerter Pfad zu `/v2/` später
- Community-Glaubwürdigkeit geringer

**Empfehlung:** Nur akzeptabel als temporäre Maßnahme wenn Option A innerhalb von 4 Wochen nach Launch nachgezogen wird.

---

## Entscheidung

| Datum | Entscheider | Gewählte Option | Begründung |
|---|---|---|---|
| _(offen)_ | _(offen)_ | _(offen)_ | _(offen)_ |

---

## Konsequenzen der Entscheidung

### Wenn Option A: #spec-wenn-option-a
- `backend/app/main.py` anpassen (Sprint 2)
- `packages/contypio-client/src/client.ts` Basis-URL anpassen
- Astro-Starter-Quickstart mit `/api/v1/`-URLs dokumentieren
- CI-Test gegen neue Endpunkte verifizieren

### Wenn Option B: #spec-wenn-option-b
- `CHANGELOG.md` anlegen
- Breaking-Change-Policy in Quickstart dokumentieren
- Datum für Nachziehen von Option A festlegen (empfohlen: innerhalb 60 Tage nach Launch)

---

## Offene Fragen

- Gibt es bereits externe Nutzer der Delivery API, die bei Option A URLs anpassen müssten?
- Ist `preview_router` und `cache_router` ebenfalls unter `/v1/` zu versionieren oder nur die Delivery-Endpunkte?
