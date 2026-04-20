# ADR: SDK-Release-Strategie für @contypio/client #sprint-adr-sdk-release-strategie-f-r-contypio-client

**Status:** OFFEN – Entscheidung erforderlich bis Ende Sprint 1
**Stand:** 20.04.2026
**Autor:** –
**Entscheider:** –

---

## Kontext

Das SDK `@contypio/client` (Version `0.3.0`) ist im Monorepo unter `packages/contypio-client/` vorhanden und technisch funktional.

**Aktueller Stand (aus package.json):**
- Version: `0.3.0`
- `engines.node`: `">=18.0.0"` ← **falsch für Astro 6**, muss `>=22.12.0` sein
- Kein `publishConfig`
- Kein `private: true`
- `prepublishOnly: npm run build` ist vorhanden (Build vor Publish konfiguriert)
- Kein CHANGELOG vorhanden
- Kein npm-Publish-Workflow in CI

Das SDK wurde noch nie auf npmjs.com veröffentlicht (kein Hinweis auf bestehende Veröffentlichung).

---

## Optionen

### Option A – npm-Publish (öffentliches Registry) #spec-option-a-npm-publish-ffentliches-registry

**Was:** `@contypio/client` wird auf npmjs.com veröffentlicht. Nutzer installieren via `npm install @contypio/client`.

**Wie:**
1. `package.json` korrigieren:
   - `engines.node` auf `">=22.12.0"` setzen
   - `publishConfig` ergänzen (falls scoped package auf public gesetzt werden soll):
     ```json
     "publishConfig": { "access": "public" }
     ```
2. npm-Account + Token konfigurieren
3. CI-Workflow: manueller Publish-Trigger oder tag-basiert (`git tag v0.3.0`)
4. CHANGELOG.md anlegen
5. Ersten offiziellen Release: `1.0.0` (nicht `0.3.0` – das signalisiert Beta)

**Aufwand:** 2–4 Stunden (Setup) + 1 Stunde pro Release danach

**Vorteile:**
- Echter DX für externe Nutzer: `npm install @contypio/client`
- Versionskontrolle über npm registry
- Nachvollziehbarer Upgrade-Pfad für Astro-Nutzer

**Nachteile:**
- npm-Account + Token-Management notwendig
- Jeder Publish ist öffentlich und permanent

**Empfehlung:** Pflicht wenn der Astro-Starter für externe Entwickler gedacht ist.

---

### Option B – Workspace-Link / file:-Dependency #spec-option-b-workspace-link-file-dependency

**Was:** Starter referenziert das SDK direkt im Monorepo:
```json
"@contypio/client": "file:../../packages/contypio-client"
```

**Wie:**
1. `package.json` des Starters mit `file:`-Referenz anlegen
2. `npm install` im Starter baut und linkt das SDK lokal
3. Keine npm-Veröffentlichung notwendig

**Aufwand:** 30 Minuten

**Vorteile:**
- Sofort einsatzbereit, kein npm-Account nötig
- Ideal für internes Demo oder Early-Preview

**Nachteile:**
- Externe Nutzer können den Starter nicht ohne das Monorepo nutzen
- `npx create-contypio-astro` ist nicht möglich
- Kein echter Astro-Go-Live für Externe

**Empfehlung:** Nur als temporäre Maßnahme während der Entwicklung in Sprint 2–3 akzeptabel.

---

### Option C – GitHub Packages / privates Registry #spec-option-c-github-packages-privates-registry

**Was:** SDK wird in einem privaten oder org-internen npm-Registry veröffentlicht.

**Aufwand:** Mittel (Registry-Setup)

**Empfehlung:** Nicht relevant für einen öffentlichen Astro-Go-Live.

---

## Bekannte Probleme die vor jedem Publish behoben sein müssen

| Problem | Datei | Korrektur |
|---|---|---|
| `engines.node: ">=18.0.0"` zu niedrig | `packages/contypio-client/package.json:39` | Auf `">=22.12.0"` setzen |
| Kein `publishConfig` für scoped package | `packages/contypio-client/package.json` | `"publishConfig": { "access": "public" }` ergänzen |
| Kein CHANGELOG | – | `CHANGELOG.md` anlegen |
| Version `0.3.0` signalisiert Beta | – | Entscheiden ob `1.0.0` zum Launch oder weiter `0.x` |

---

## Entscheidung

| Datum | Entscheider | Gewählte Option | Begründung |
|---|---|---|---|
| _(offen)_ | _(offen)_ | _(offen)_ | _(offen)_ |

---

## Konsequenzen der Entscheidung

### Wenn Option A (npm-Publish): #spec-wenn-option-a-npm-publish
- `engines.node` in package.json korrigieren (vor Sprint 2)
- `publishConfig` ergänzen
- npm-Token als CI-Secret hinterlegen
- CI-Job: `npm publish` auf Tag oder manuell
- CHANGELOG.md anlegen
- Entscheidung: Launch mit `1.0.0` oder `0.4.0`?

### Wenn Option B (file:-Link, temporär): #spec-wenn-option-b-file-link-tempor-r
- Starter-README muss explizit darauf hinweisen dass Monorepo benötigt wird
- Zeitplan für Option A (npm-Publish) festlegen – spätestens 4 Wochen nach erstem Public-Commit des Starters
