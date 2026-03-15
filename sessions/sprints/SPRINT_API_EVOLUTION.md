# Sprint: API Evolution — Batch, Cursor-Pagination, SDK v0.2

**Erstellt:** 2026-03-15
**Branch:** main
**Status:** IN ARBEIT
**Abhaengigkeit:** SDK v0.1.0 (DONE, Commit 59dc944)
**Geschaetzter Aufwand:** 1-2 Sessions

---

## Kontext

Die Delivery API ist funktional (L20a DONE), das SDK v0.1.0 existiert.
Aber fuer produktive SSG-Builds fehlen kritische Features:

- **435+ Collection-Items** (IR-Tours) erzeugen bei Offset-Pagination teure DB-Scans
- **100 req/min Rate Limit** wird bei SSG-Builds mit vielen Seiten zum Engpass
- **N einzelne Requests** pro Seite sind ineffizient — Batch-Endpoints fehlen
- **SDK** hat kein Caching, keine Retries, keine Cursor-Unterstuetzung

**Ziel:** Die Delivery API und das SDK auf ein Niveau bringen, das effiziente
SSG-Builds mit Hunderten von Seiten ermoeglicht.

---

## Aufgabe 1: Batch-Endpoint fuer Pages

**Prioritaet:** HOCH
**Datei:** `backend/app/delivery/pages.py`

### Endpoint

```
POST /content/pages/batch
Content-Type: application/json

{
  "slugs": ["homepage", "about", "contact", "blog"],
  "fields": "title,seo,sections",
  "include_css": false
}
```

### Response

```json
{
  "items": {
    "homepage": { "id": 1, "title": "Homepage", ... },
    "about": { "id": 2, "title": "About", ... },
    "contact": null,
    "blog": { "id": 4, "title": "Blog", ... }
  },
  "resolved": 3,
  "not_found": ["contact"]
}
```

### Tasks

- [x] **1.1** `POST /content/pages/batch` Endpoint implementieren
  - Max 50 Slugs pro Request (400 bei Ueberschreitung)
  - Sparse fields + include_css unterstuetzt
  - Nicht gefundene Slugs als `null` + in `not_found` Liste
  - Volle Section/Media-Resolution wie bei Einzel-Endpoint
- [x] **1.2** Pydantic Request-Schema: `BatchPagesRequest(slugs: list[str], fields: str | None, include_css: bool)`
- [x] **1.3** DB-Query optimieren: `WHERE slug IN (...)` statt N Einzel-Queries
- [x] **1.4** Cache-Header: ETag ueber kombinierten Hash aller Seiten

### Akzeptanzkriterien
- 10 Seiten in 1 Request statt 10 Requests
- Nicht gefundene Slugs erzeugen keinen 404 (graceful degradation)
- Rate Limit: 1 Request statt N

---

## Aufgabe 2: Cursor-Pagination fuer Collections

**Prioritaet:** MITTEL
**Datei:** `backend/app/delivery/collections.py`, `backend/app/delivery/query_params.py`

### Neuer Parameter

```
GET /content/collections/{key}?cursor=eyJpZCI6MTAwfQ&limit=20
```

### Cursor-Format

Base64-kodiertes JSON: `{"id": 100, "sort": "title", "value": "Beach Tour"}`

### Response-Erweiterung

```json
{
  "items": [...],
  "total": 435,
  "limit": 20,
  "has_more": true,
  "next_cursor": "eyJpZCI6MTIwLCJzb3J0IjoiIiwidmFsdWUiOiIifQ",
  "prev_cursor": "eyJpZCI6MTAxLCJzb3J0IjoiIiwidmFsdWUiOiIifQ"
}
```

### Tasks

- [x] **2.1** Cursor-Encoding/Decoding Utility (`cursor_to_dict`, `dict_to_cursor`)
- [x] **2.2** `CursorParams` Klasse in `query_params.py`
- [x] **2.3** Collections-Endpoint erweitern: `cursor` Parameter neben `offset`
  - Wenn `cursor` gesetzt: WHERE-Clause statt OFFSET (keyset pagination)
  - Wenn `offset` gesetzt: Bisheriges Verhalten (Abwaertskompatibel)
- [x] **2.4** `next_cursor` und `prev_cursor` in Response einbauen
  - Immer gesetzt wenn `has_more=true` bzw. nicht auf erster Seite

### Akzeptanzkriterien
- `?cursor=...&limit=20` liefert naechste 20 Items ohne DB-Offset-Scan
- Bestehende `?offset=` Requests funktionieren weiterhin (keine Breaking Change)
- Cursor funktioniert mit allen Sort-Feldern (sort_order, title, created_at, etc.)

---

## Aufgabe 3: SDK v0.2 — Batch, Cursor, Retry

**Prioritaet:** HOCH
**Datei:** `packages/contypio-client/src/`

### Neue SDK-Features

```typescript
// Batch — 1 Request fuer viele Seiten
const pages = await client.pages.batch(["home", "about", "blog"]);
// { items: { home: Page, about: Page, blog: null }, resolved: 2, not_found: ["blog"] }

// Cursor-Iterator — automatisches Durchblaettern
for await (const item of client.collections.iterate("tours", { sort: "-created_at" })) {
  console.log(item.title);
}

// Oder manuell mit Cursor
const page1 = await client.collections.list("tours", { limit: 50 });
const page2 = await client.collections.list("tours", { limit: 50, cursor: page1.next_cursor });
```

### Tasks

- [x] **3.1** Types erweitern:
  - `BatchPagesRequest`, `BatchPagesResponse`
  - `CursorPaginatedResult<T>` (extends PaginatedResult + next_cursor, prev_cursor)
  - `ListCollectionParams.cursor` hinzufuegen
- [x] **3.2** `pages.batch(slugs, params?)` Methode — POST Request
- [x] **3.3** `collections.list()` Response-Typ um Cursor-Felder erweitern
- [x] **3.4** `collections.iterate(key, params?)` — AsyncIterator der automatisch durch alle Seiten blättert
- [x] **3.5** Retry mit Exponential Backoff bei 429 (Rate Limit)
  - Default: 3 Retries, Backoff 1s/2s/4s
  - Konfigurierbar via `ContypioConfig.retry`
- [x] **3.6** README aktualisieren: Batch, Cursor, Retry Beispiele

### Akzeptanzkriterien
- `client.pages.batch()` sendet POST und parsed Response korrekt
- `client.collections.iterate()` iteriert automatisch ueber alle Seiten
- Bei 429-Response: wartet und wiederholt automatisch (max 3x)
- Alle neuen Methoden voll typisiert, kein `any`
- `npm run build` kompiliert fehlerfrei

---

## Aufgabe 4: API-Referenz aktualisieren

**Prioritaet:** MITTEL
**Datei:** `docs/api-reference.md`

### Tasks

- [x] **4.1** Batch-Endpoint dokumentieren (Request/Response/Limits)
- [x] **4.2** Cursor-Pagination Abschnitt hinzufuegen
- [x] **4.3** SDK v0.2 Features in Beispielen zeigen

### Akzeptanzkriterien
- Jeder neue Endpoint/Parameter ist dokumentiert
- Beispiele sind copy-pasteable

---

## Reihenfolge

```
Phase 1:  Aufgabe 1 (Batch-Endpoint Backend)
Phase 2:  Aufgabe 2 (Cursor-Pagination Backend)
Phase 3:  Aufgabe 3 (SDK v0.2)
Phase 4:  Aufgabe 4 (Docs Update)
```

---

## Verifizierung (Definition of Done)

- [ ] `POST /content/pages/batch` funktioniert mit bis zu 50 Slugs
- [ ] `?cursor=` funktioniert fuer Collections neben bestehendem `?offset=`
- [ ] SDK v0.2: `batch()`, `iterate()`, Retry bei 429
- [ ] `npm run build` im SDK fehlerfrei
- [ ] `docs/api-reference.md` aktualisiert
- [ ] Kein Breaking Change in bestehenden Endpoints

---

## Kritische Entscheidungen

| Entscheidung | Begruendung |
|---|---|
| Batch max 50 Slugs | Verhindert Missbrauch, reicht fuer typische SSG-Builds |
| Cursor Base64-JSON | Opak fuer Client, flexibel fuer verschiedene Sort-Felder |
| Offset bleibt bestehen | Abwaertskompatibel, Cursor ist Opt-in |
| Retry nur bei 429 | Keine Retries bei 4xx/5xx — das waeren echte Fehler |
| AsyncIterator fuer iterate() | Native JS-Pattern, funktioniert mit for-await-of |
