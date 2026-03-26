# Sprint: Singleton Collections + IR-Tours Go-Live

**Erstellt:** 2026-03-26
**Kontext:** Anforderungen aus `contypio-anforderungen-irtours.md`
**Ziel:** Globals durch Singleton-Collections ersetzen (Produkt-Feature) + IR-Tours Content-Luecken schliessen

---

## Analyse-Ergebnis

### Block-Typen: KEIN Gap (30/30 aligned)

Alle Block-Typen sind bereits 1:1 kompatibel zwischen Contypio Backend und Astro CmsBlockRenderer (identische camelCase-Namen). Kein Handlungsbedarf.

### Globals-System: Architektur-Problem

Das aktuelle Globals-System (`site-settings`, `social-media`) ist **hardcoded** — Felder stehen im Frontend-Code, nicht in einem Schema. Jede Feld-Aenderung erfordert ein Code-Deploy.

Das Collection-System hat bereits alles was Globals brauchen:
- Dynamisches Schema mit 16 Feldtypen
- Schema-Editor per UI
- Automatisch generierte Formulare
- Media-Resolution, i18n, Validierung

**Loesung:** Globals werden Singleton-Collections (Directus-Pattern). `singleton: true` Flag am Schema → Frontend zeigt Formular statt Liste, Delivery liefert ein Objekt statt Array.

---

## Phase 1 — Singleton Collections (Product Feature)

### Task 1.1: Singleton-Flag am Collection-Schema

**Wo:** `backend/app/models/collection.py`
**Was:**
- [ ] `singleton: Mapped[bool] = mapped_column(Boolean, default=False)` an `CmsCollectionSchema`
- [ ] Alembic Migration erstellen

**Aufwand:** ~15min

### Task 1.2: Backend-Logik fuer Singletons

**Wo:** `backend/app/services/collection_service.py` + `backend/app/api/collections.py`
**Was:**
- [ ] Bei `singleton=True`: max. 1 Item pro Collection erzwingen
- [ ] `GET /api/collections/{key}/item` — neuer Endpoint, liefert den einen Eintrag direkt (ohne Array)
- [ ] `PUT /api/collections/{key}/item` — erstellt oder aktualisiert den Singleton-Eintrag
- [ ] Schema-API: `singleton` Feld im Create/Update mitsenden

**Aufwand:** ~1.5h

### Task 1.3: Delivery-API Alias fuer Globals

**Wo:** `backend/app/delivery/globals.py` (umbauen)
**Was:**
- [ ] `/content/globals/{slug}` liest aus `cms_collections` statt `cms_globals` (wo `singleton=True`)
- [ ] `/content/globals/` (Batch) sammelt alle Singleton-Collections
- [ ] Response-Format bleibt identisch: `{ slug, label, data }` — **kein Breaking Change fuer Astro**
- [ ] Media-Resolution kommt automatisch ueber Collection-Delivery (schema-basiert statt Pattern-Matching)
- [ ] i18n kommt automatisch ueber Collection-i18n (schema-basiert statt hardcoded `GLOBAL_TRANSLATABLE_FIELDS`)

**Aufwand:** ~2h

### Task 1.4: Frontend — Singleton-Modus im Collection-Editor

**Wo:** `frontend/src/pages/CollectionItemList.tsx` (oder wo Items gelistet werden)
**Was:**
- [ ] Wenn Schema `singleton=True` → direkt `DynamicForm` anzeigen, keine Liste
- [ ] Kein "Neues Item" Button, kein Loeschen, kein Sortieren
- [ ] Save-Button wie im aktuellen GlobalEditor (StickyFooter)
- [ ] Navigation: Singletons erscheinen unter "Einstellungen" statt unter "Collections"

**Aufwand:** ~2h

### Task 1.5: Navigation-Editor erhalten

**Wo:** Frontend
**Was:**
- [ ] `navigation` bleibt Singleton-Collection, bekommt aber weiterhin den **Spezial-Editor** (NavigationEditor.tsx)
- [ ] Schema-Feld `editor: "navigation"` oder Frontend-Route-Check → Spezial-Editor laden statt DynamicForm
- [ ] Baumstruktur mit Drag & Drop ist kein Standard-Formular und braucht den eigenen Editor

**Aufwand:** ~30min

### Task 1.6: Seed-Migration

**Wo:** `backend/app/services/seed_collections.py`
**Was:**
- [ ] `site-settings` als Singleton-Collection-Schema definieren:
  ```python
  {
      "collection_key": "site-settings",
      "label": "Site Settings",
      "label_singular": "Site Settings",
      "singleton": True,
      "icon": "Settings",
      "fields": [
          {"name": "site_name", "type": "text", "label": "Site-Name", "required": True},
          {"name": "tagline", "type": "text", "label": "Tagline"},
          {"name": "logo", "type": "media-picker", "label": "Logo"},
          {"name": "contact_email", "type": "email", "label": "Kontakt E-Mail"},
          {"name": "contact_phone", "type": "phone", "label": "Telefon"},
          {"name": "address", "type": "textarea", "label": "Adresse"},
      ],
  }
  ```
- [ ] `social-media` als Singleton-Collection-Schema:
  ```python
  {
      "collection_key": "social-media",
      "label": "Social Media",
      "label_singular": "Social Media",
      "singleton": True,
      "icon": "Share2",
      "fields": [
          {"name": "instagram", "type": "url", "label": "Instagram"},
          {"name": "facebook", "type": "url", "label": "Facebook"},
          {"name": "youtube", "type": "url", "label": "YouTube"},
          {"name": "tiktok", "type": "url", "label": "TikTok"},
      ],
  }
  ```
- [ ] `navigation` als Singleton-Collection-Schema (mit `editor: "navigation"` Marker)
- [ ] Globals-Seed (`_build_globals_seed`) entfernen
- [ ] Datenmigration: bestehende `cms_globals` Daten nach `cms_collections` uebertragen (einmal-Script)

**Aufwand:** ~1h

### Task 1.7: Alten Globals-Code entfernen

**Wo:** Backend + Frontend
**Was:**
- [ ] `backend/app/models/global_config.py` — CmsGlobal Model entfernen (nach Datenmigration)
- [ ] `backend/app/api/globals.py` — Admin-API entfernen (ersetzt durch Collection-API)
- [ ] `backend/app/services/global_service.py` — Service entfernen
- [ ] `frontend/src/pages/GlobalEditor.tsx` — hardcoded Editor entfernen
- [ ] `frontend/src/components/globals/SocialMediaEditor.tsx` — entfernen
- [ ] Navigation-Routen im Frontend anpassen
- [ ] **NICHT entfernen:** `backend/app/delivery/globals.py` — bleibt als Alias-Layer

**Aufwand:** ~1h

---

## Phase 2 — IR-Tours Content (Admin-Arbeit, kein Code)

> Ab hier ist alles Content-Pflege im Admin-UI. Keine Code-Aenderungen.
> IR-Tours ist der erste Kunde der Singleton-Collections nutzt.

### Task 2.1: site-settings befuellen

**Wo:** Admin → Einstellungen → Site Settings
**Was:**
- [ ] `site_name` = "i+r Tours GmbH"
- [ ] `tagline` = Slogan
- [ ] `logo` = Logo hochladen (Media-Picker!)
- [ ] `contact_email`, `contact_phone`, `address`
- [ ] Beliebige weitere Felder per Schema-Editor ergaenzen (z.B. `oeffnungszeiten`, `mobil`)

### Task 2.2: social-media befuellen

**Wo:** Admin → Einstellungen → Social Media
**Was:** Instagram, Facebook, YouTube URLs eintragen

### Task 2.3: navigation befuellen

**Wo:** Admin → Einstellungen → Navigation
**Was:** Komplette IR-Tours Hauptnavigation + Footer-Links

### Task 2.4: Rechtsseiten anlegen

**Wo:** Admin → Seiten
**Was:**
- [ ] `/agb` — richText-Block mit AGB-Text
- [ ] `/datenschutz` — richText-Block mit Datenschutzerklaerung
- [ ] `/impressum` — richText-Block mit Impressum

### Task 2.5: Fehlende Seiten

- [ ] `/reiseziele/suedamerika` — Seite erstellen (aktuell 404)
- [ ] `/br-reisen` — Hero-Bereich befuellen
- [ ] Reiseziel-Seiten mit Hero + Beschreibung
- [ ] Kategorie-Seiten (Flugreisen, Busreisen etc.)

---

## Zusammenfassung

| Phase | Was | Aufwand | Typ |
|---|---|---|---|
| **Phase 1** | Singleton Collections | ~8h | Code (Product Feature) |
| **Phase 2** | IR-Tours Content | ~4h | Admin-UI (Content) |

### Was das Produkt gewinnt

1. **Kein separates Globals-System mehr** — weniger Code, weniger Wartung
2. **Jeder Tenant konfiguriert seine Einstellungen selbst** — per Schema-Editor, alle 16 Feldtypen
3. **IR-Tours fuegt `oeffnungszeiten`, `mobil`, `social_google` selbst hinzu** — kein Code-Deploy
4. **Directus-Pattern** — bewaehrtes Konzept, Nutzer kennen es
5. **Delivery-API bleibt abwaertskompatibel** — Astro merkt nichts von der Umstellung

### Abhaengigkeiten

```
Task 1.1 (Model) → 1.2 (API) → 1.3 (Delivery) → 1.4 (Frontend)
                                                 → 1.5 (Nav-Editor)
Task 1.1 (Model) → 1.6 (Seed) → 1.7 (Cleanup)
Phase 1 komplett → Phase 2 (Content)
```

### Risiken

- **Datenmigration:** Bestehende `cms_globals` Daten muessen sicher nach `cms_collections` uebergefuehrt werden. Einmal-Script mit Rollback.
- **Navigation-Editor:** Muss weiterhin funktionieren — nicht versehentlich durch DynamicForm ersetzen.
- **Delivery-Kompatibilitaet:** Response-Format `/content/globals/{slug}` darf sich NICHT aendern.
