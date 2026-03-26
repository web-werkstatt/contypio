# Sprint: Schema Editor Slide-over Panel

**Erstellt:** 2026-03-26
**Basis:** Schema Editor Spec (vom User via Claude generiert)
**Ziel:** Schema Editor als Slide-over Panel, aufrufbar aus Collection- und Singleton-Editor

---

## Ist-Zustand

### Was existiert

| Komponente | Datei | Zeilen | Funktion |
|---|---|---|---|
| SchemaEditor (Page) | `pages/SchemaEditor.tsx` | 176 | Vollseiten-Editor fuer Collection-Schemas |
| FieldsEditor | `components/collections/FieldsEditor.tsx` | 278 | Feld-Liste mit Add/Remove/Reorder/TypeChange |
| OptionsEditor | (in FieldsEditor) | 30 | Inline-Options fuer Select-Felder |
| SubFieldsEditor | (in FieldsEditor) | 82 | Verschachtelte Felder fuer Group/Repeater |
| RelationConfigEditor | `components/collections/RelationConfigEditor.tsx` | 77 | Ziel-Collection Dropdown |
| AiFieldConfig | `components/collections/AiFieldConfig.tsx` | 110 | KI-Feld-Konfiguration |
| useFieldTypePresets | `hooks/useFieldTypePresets.ts` | 36 | Laedt Feldtyp-Presets (API + Fallback) |

### Aktuell 17 Feldtypen (Backend Presets)

text, email, phone, url, number, date, textarea, richtext, select, toggle, boolean, color, media, media-picker, group, repeater, relation

### Was fehlt (laut Spec)

- **Slide-over Panel** statt Vollseiten-Editor
- **Detail-Panel** pro Feld (statt alles inline)
- **Validierungsregeln** (minLength, maxLength, min, max, pattern, custom)
- **Neue Feldtypen:** markdown, range, radio, checkbox, datetime, tags
- **Rollen-Check:** Button nur fuer Admins sichtbar
- **"Felder verwalten" Button** im Collection/Singleton Editor Header

---

## Architektur-Entscheidung

**NICHT** den bestehenden SchemaEditor.tsx umbauen — der bleibt fuer die Vollseiten-Ansicht unter `/collections/new` und `/collections/{key}/edit`.

**STATTDESSEN** eine neue Komponente `SchemaSlideOver.tsx` bauen, die:
- Den bestehenden `FieldsEditor` Kern wiederverwendet (Logik)
- Ein neues UI als Slide-over Panel hat
- Vom CollectionEditor/Singleton-Modus aufgerufen wird

---

## Tasks

### Task 1: SchemaSlideOver Komponente

**Neue Datei:** `frontend/src/components/collections/SchemaSlideOver.tsx`

**Struktur:**
```
<SchemaSlideOver open={boolean} onClose={fn} collectionKey={string}>
  ├── Backdrop (dimmed, click-to-close)
  ├── Panel (420px, von rechts, transition)
  │   ├── Header (sticky): Titel + Collection-Key + Close-Button
  │   ├── Body (scrollbar):
  │   │   ├── FieldList (Drag & Drop Rows)
  │   │   ├── AddFieldDropdown + Button
  │   │   └── FieldDetailPanel (wenn Feld selektiert)
  │   └── Footer (sticky): "Schema speichern" + "Abbrechen"
  └──
```

**Props:**
```typescript
interface SchemaSlideOverProps {
  open: boolean;
  onClose: () => void;
  collectionKey: string;
  onSaved?: () => void;  // Callback nach erfolgreichem Save
}
```

**Verhalten:**
- Laedt Schema via `GET /api/collections/{key}/schema` beim Oeffnen
- Arbeitet auf lokaler Kopie der Fields
- Speichert via `PUT /api/collections/{key}` (nur fields-Array)
- Schliesst sich nach Save, ruft `onSaved` auf
- ESC-Taste schliesst (mit Confirm bei Aenderungen)
- Overlay-Klick schliesst (mit Confirm bei Aenderungen)

**Aufwand:** ~120 Zeilen (Panel-Shell + State-Management)

### Task 2: FieldRow Komponente

**In:** `SchemaSlideOver.tsx` (oder eigene Datei wenn > 50 Zeilen)

**Pro Feld-Zeile:**
```
[ ⠿ ]  [ Label ]  [ type-badge ]  [ req? ]  [ ✏ ] [ 🗑 ]
```

- Drag Handle (HTML5 oder dnd-kit, je nach Praeferenz)
- Type-Badge: `font-mono`, klein, farbig nach Kategorie
- Required-Badge: nur wenn `required: true`
- Edit-Button: oeffnet Detail-Panel
- Delete-Button: mit Confirm-Dialog

**Aufwand:** ~60 Zeilen

### Task 3: FieldDetailPanel Komponente

**In:** `SchemaSlideOver.tsx` (inline unterhalb der Liste)

**Immer sichtbar:**
- Label (text input)
- Key (text input, mono, auto-generiert aus Label)
- Feldtyp (select dropdown)
- Pflichtfeld (toggle)

**Typ-spezifische Extras:**
- `select`, `radio`, `checkbox` → OptionsEditor (existiert)
- `relation` → RelationConfigEditor (existiert)
- `group`, `repeater` → SubFieldsEditor (existiert) oder Button zu verschachteltem Panel
- `number`, `range` → Min/Max Inputs
- `media` → Erlaubte Typen Checkboxen, Mehrfach-Toggle

**Aufwand:** ~80 Zeilen (Dispatch-Logik + typ-spezifische Sections)

### Task 4: Validierungsregeln

**In:** FieldDetailPanel, unterhalb der Basis-Felder

**UI:**
```
Validierung:
[ minLength ▼ ]  [ 5     ]  [ × ]
[ pattern   ▼ ]  [ ^https ]  [ × ]
[ + Regel hinzufuegen ▼ ]
```

**Regeln:** minLength, maxLength, min, max, pattern, custom

**Datenstruktur:**
```typescript
interface Validation {
  rule: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value: string;
}
```

**Backend-Aenderung:** `validations` Feld an FieldDef Schema ergaenzen (Pydantic + TypeScript)

**Aufwand:** ~50 Zeilen Frontend + ~5 Zeilen Backend

### Task 5: Neue Feldtypen registrieren

**Backend:** `backend/app/services/seed_collections.py` (FIELD_TYPE_PRESETS ergaenzen)
**Frontend:** `frontend/src/lib/fieldTypeRegistry.ts` (Fallback-Definitionen ergaenzen)

Neue Typen:
| Typ | Render | Config |
|---|---|---|
| `markdown` | textarea | `{ rows: 8, monospace: true }` |
| `range` | input | `{ inputType: "range", min: 0, max: 100 }` |
| `radio` | select | `{ variant: "radio" }` |
| `checkbox` | select | `{ variant: "checkbox", multiple: true }` |
| `datetime` | input | `{ inputType: "datetime-local" }` |
| `tags` | input | `{ inputType: "text", variant: "tags" }` |

**Frontend FieldRenderer:** Neue Render-Varianten fuer radio, checkbox, range, tags, markdown

**Aufwand:** ~30 Zeilen Backend + ~80 Zeilen Frontend (FieldRenderer erweitern)

### Task 6: "Felder verwalten" Button einbauen

**Wo:** `frontend/src/pages/CollectionEditor.tsx`

**Beide Modi (Liste + Singleton):**
```tsx
// Im Header, neben dem Titel
{user.role === 'admin' && (
  <button onClick={() => setSchemaOpen(true)}>
    <Settings size={14} /> Felder verwalten
  </button>
)}
<SchemaSlideOver
  open={schemaOpen}
  onClose={() => setSchemaOpen(false)}
  collectionKey={key}
  onSaved={() => {
    queryClient.invalidateQueries({ queryKey: ['collectionSchema', key] });
    setSchemaOpen(false);
  }}
/>
```

**Rollen-Check:** Nur `admin` und `super-admin` sehen den Button

**Aufwand:** ~15 Zeilen

### Task 7: Singletons zurueck in Collections-Sidebar

**Wo:** `frontend/src/components/layout/CollectionsLayout.tsx` + `App.tsx`

**Was:**
- [ ] Singleton-Filter aus CollectionsLayout entfernen (Singletons wieder anzeigen)
- [ ] Singletons visuell absetzen (z.B. eigene Gruppe "Einstellungen" in der Sidebar)
- [ ] Settings-Routes fuer `general` und `social-media` entfernen (nicht mehr noetig)
- [ ] Settings-Seite behaelt nur: Navigation, Webhooks, API-Keys, Import, Module

**Aufwand:** ~30 Zeilen

---

## Abhaengigkeiten

```
Task 4 (Validierungen) → benoetigt Task 3 (DetailPanel)
Task 6 (Button) → benoetigt Task 1 (SlideOver)
Task 7 (Sidebar) → unabhaengig, kann parallel

Task 1 (SlideOver Shell)
  → Task 2 (FieldRow)
  → Task 3 (DetailPanel)
    → Task 4 (Validierungen)
  → Task 5 (Neue Feldtypen)
→ Task 6 (Button einbauen)
→ Task 7 (Sidebar umbauen)
```

**Empfohlene Reihenfolge:** 1 → 2 → 3 → 6 → Deploy → 4 → 5 → 7

---

## Aufwand-Schaetzung

| Task | Zeilen (ca.) | Aufwand |
|---|---|---|
| 1. SlideOver Shell | ~120 | 30 min |
| 2. FieldRow | ~60 | 15 min |
| 3. FieldDetailPanel | ~80 | 20 min |
| 4. Validierungsregeln | ~55 | 15 min |
| 5. Neue Feldtypen | ~110 | 30 min |
| 6. Button einbauen | ~15 | 5 min |
| 7. Sidebar umbauen | ~30 | 10 min |
| **Gesamt** | **~470** | **~2h** |

---

## Dateien die geaendert/erstellt werden

| Aktion | Datei |
|---|---|
| **NEU** | `frontend/src/components/collections/SchemaSlideOver.tsx` |
| EDIT | `frontend/src/pages/CollectionEditor.tsx` (Button + State) |
| EDIT | `frontend/src/components/layout/CollectionsLayout.tsx` (Sidebar) |
| EDIT | `frontend/src/App.tsx` (Settings-Routes bereinigen) |
| EDIT | `frontend/src/types/cms.ts` (Validation interface, FieldDef erweitern) |
| EDIT | `frontend/src/components/collections/FieldRenderer.tsx` (neue Render-Varianten) |
| EDIT | `frontend/src/lib/fieldTypeRegistry.ts` (neue Typen) |
| EDIT | `backend/app/schemas/collection.py` (validations Feld) |
| EDIT | `backend/app/services/seed_collections.py` (neue Presets) |

---

## Was NICHT in diesem Sprint

- Bestehenden SchemaEditor.tsx (`/collections/{key}/edit`) umbauen — bleibt als Vollseiten-Variante
- Backend-seitige Validierung (Validierungsregeln werden gespeichert, aber noch nicht vom Backend erzwungen)
- Rollen-System erweitern (nutzt bestehendes `user.role` Feld)
