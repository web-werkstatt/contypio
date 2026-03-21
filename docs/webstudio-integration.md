# Contypio + Webstudio Integration — Konzept & PoC Plan

> **Status:** Entwurf
> **Autor:** Joseph / web-werkstatt.at
> **Datum:** 2026-03-21
> **Zweck:** Webstudio als visuelles Design-Tool in den Contypio-Workflow integrieren.

---

## 1. Vision

Webstudio wird als **visuelles Design-Werkzeug** in den Contypio-Stack integriert. Es ersetzt weder Astro (Frontend) noch Contypio (CMS) — es ist das Tool mit dem **Designer Layouts und Komponenten visuell bauen**, die dann in Astro-Komponenten uebernommen werden.

### Workflow

```
Designer                    Entwickler                    Redakteur
   |                            |                             |
   v                            v                             v
Webstudio                    Astro                        Contypio
(Design-Tool)              (Frontend/SSG)               (Headless CMS)
   |                            |                             |
   | exportiert                 | rendert                     | liefert
   | HTML/CSS                   | Seiten                      | Inhalte
   v                            v                             v
Templates/Layouts  -------->  Komponenten  <---------  Delivery API
```

### Rollenverteilung

| Tool | Rolle | Wer nutzt es |
|---|---|---|
| **Webstudio** | Visuelles Design — Layouts, Spacing, Farben, Responsive | Designer |
| **Astro** | Frontend-Framework — SSG, Routing, Performance, Deployment | Entwickler |
| **Contypio** | Content Management — Seiten, Collections, Media, API | Redakteur |

---

## 2. Warum Webstudio?

### Problem heute

Designer erstellen Layouts in Figma/Photoshop → Entwickler baut sie in Astro/Tailwind nach → Abweichungen, Zeitverlust, Kommunikationsprobleme.

### Loesung mit Webstudio

Designer baut direkt im Browser mit echtem CSS → Export = fertiges HTML/CSS → Converter uebersetzt automatisch in Tailwind → Entwickler uebernimmt in Astro-Komponenten.

| Aspekt | Figma → Code | Webstudio → Code |
|---|---|---|
| Output | Bild/Vektor (muss nachgebaut werden) | Echtes HTML/CSS (direkt nutzbar) |
| Responsive | Nur angedeutet | Echt, mit Breakpoints |
| CSS-Kontrolle | Keine | Volle CSS-Properties |
| Browser-Rendering | Nein | Ja, echtes Rendering |
| Uebergabe | Screenshot + Specs | Exportierter Code + automatische Tailwind-Konvertierung |

### Vergleich mit Bricks Builder

| Feature | Webstudio | Bricks (WordPress) |
|---|---|---|
| Visueller Editor | Ja, pixel-perfekt | Ja, pixel-perfekt |
| CSS-Kontrolle | Alle Properties | Alle Properties |
| Open Source | Ja (AGPL) | Nein (kommerziell) |
| WordPress-Abhaengigkeit | Nein | Ja |
| Self-hosted | Ja | Nur via WordPress |
| Export als Code | Ja (HTML/CSS) | Nein (in WP eingesperrt) |
| Headless-faehig | Ja | Nein |

---

## 3. Technische Analyse

### 3.1 Webstudio Export

Webstudio CLI exportiert Projekte in zwei Formaten:

1. **Statisch:** HTML/CSS/JS Dateien
2. **Remix App:** Dynamische Anwendung

Fuer unseren Zweck ist der **statische Export** relevant — daraus werden Astro-Komponenten abgeleitet.

### 3.2 Automatische CSS → Tailwind Konvertierung

Der Webstudio-Export erzeugt eigenes atomares CSS, nicht Tailwind-Klassen.
Anstatt diese manuell zu uebersetzen, nutzt der Converter die Library
[`css-to-tailwindcss`](https://github.com/Jackardios/css-to-tailwindcss) (Jackardios, MIT-Lizenz)
als programmatischen Parser.

**Pipeline:**
```
Webstudio Export (atomares CSS)
       |
       v
css-to-tailwindcss (Library)
       |
       v
Tailwind-Utility-Strings pro Selector
       |
       v
Astro-Komponenten mit Tailwind-Klassen
```

**Beispiel (Pseudocode):**
```ts
import { TailwindConverter } from "css-to-tailwindcss";

const converter = new TailwindConverter({
  remInPx: 16,
  tailwindConfig: {/* Projekt-spezifisches Theme */}
});

const { nodes } = await converter.convertCSS(webstudioCss);
const heroClasses = nodes
  .find(n => n.rule.selector === ".hero")
  .tailwindClasses;

// heroClasses → "flex flex-col items-center gap-8 p-16 bg-slate-900 text-white"
```

Das ist kein Luftschloss — `css-to-tailwindcss` ist ein real existierendes,
programmatisch nutzbares npm-Paket (~140 Stars, MIT, aktiv gepflegt).

**Kapselung:** Das Tool wird hinter einer eigenen Wrapper-Funktion gekapselt,
damit es bei Bedarf gegen ein anderes (oder eigenen Code) getauscht werden kann:

```ts
// converter/src/css-to-tw.ts — Wrapper, nicht direkt importieren
import { TailwindConverter } from "css-to-tailwindcss";

export interface TwMapping {
  selector: string;
  tailwindClasses: string;
  unconverted: string[]; // CSS-Properties die nicht gemappt werden konnten
}

export async function convertCssToTw(
  css: string,
  tailwindConfig?: object
): Promise<TwMapping[]> {
  const converter = new TailwindConverter({
    remInPx: 16,
    tailwindConfig: tailwindConfig ?? {}
  });
  const { nodes } = await converter.convertCSS(css);
  return nodes.map(n => ({
    selector: n.rule.selector,
    tailwindClasses: n.tailwindClasses.join(" "),
    unconverted: n.unconvertedProperties ?? []
  }));
}
```

Alle anderen Teile des Converters importieren nur `convertCssToTw()`,
nie `css-to-tailwindcss` direkt. So bleibt die Abhaengigkeit austauschbar.

### 3.3 Schema-driven Block-Mapping

Contypio stellt einen `/content/schema`-Endpoint bereit, der Blocktypen,
Felder und Strukturen beschreibt. Der Converter liest dieses Schema ein
und mappt Webstudio-Komponenten auf Contypio-Blocktypen:

| Webstudio-Komponente | Contypio-Blocktyp |
|---|---|
| `HeroPrimary` | `hero_primary` |
| `CardGrid` | `card_grid` |
| `FAQAccordion` | `faq` |
| `CTABanner` | `cta` |

**Wichtig:** Weder Contypio noch Webstudio wissen von diesem Mapping.
Die Kopplung bleibt lose — das Mapping passiert ausschliesslich im Converter.

Fuer Designer und Redakteure ist das unsichtbar. Sie sehen nur
"Komponente X" — das technische Mapping ist ein internes Detail.

### 3.4 Astro-Starter als Converter-Basis

Output-Ziel fuer Contypio ist immer `starters/astro/`. Der Converter
erweitert den Starter:

- Legt zusaetzliche Komponenten ab
- Ergaenzt Routes
- Passt `astro.config.mjs` / `tsconfig` an

Der Converter ist ein **Customizer**, kein Generator-Monolith.
Er baut auf bestehenden Komponenten und der SDK-Integration
(`@contypio/client`) auf — niemals alles komplett neu.

### 3.5 Was Webstudio in diesem Workflow NICHT macht

- Keine CMS-Anbindung (das macht Astro + Contypio SDK)
- Kein Deployment (das macht Astro)
- Kein Content-Management (das macht Contypio)
- Kein Code-Output der direkt in Produktion geht

---

## 4. Proof of Concept

### 4.1 Ziel

Die **ir-tours.de Startseite** in Webstudio visuell nachbauen als Design-Vorlage. Dann pruefen ob der Workflow Designer → Converter → Astro-Komponente fluessig funktioniert.

### 4.2 MVP-Scope (bewusst klein)

Nicht die ganze Startseite auf einmal, sondern **zwei Komponenten**:

1. **Hero-Block** — Vollbild-Bild, Headline, Subline, CTA-Button
2. **Card-Liste** — 3-4 Reiseziel-Karten im Grid

Erst wenn diese beiden sauber durch die Pipeline laufen (Webstudio → Converter → Astro + Contypio), weitere Blocktypen hinzufuegen.

### 4.3 PoC Schritte

#### Schritt 1: Design in Webstudio (Zeitbox: 2-3 Stunden)
- Neues Projekt im self-hosted Builder
- Nur Hero-Block + Card-Liste visuell bauen
- Design-System definieren: Farben, Typo, Spacing
- Responsive fuer Desktop + Mobile
- **Danach dokumentieren:** Reibungen, Aha-Momente, Zeitaufwand

#### Schritt 2: Screen-Diffs erstellen
- Screenshots aus Webstudio (Desktop + Mobile Viewport)
- Playwright oder manuelle Viewport-Screenshots
- Diese dienen als **Referenz-Baseline** fuer den Vergleich

#### Schritt 3: Minimaler Converter-Prototyp
- Webstudio CLI Export ausfuehren
- `css-to-tailwindcss` auf den Export anwenden
- Eine Section (Hero) automatisch konvertieren
- Ergebnis dokumentieren: Was klappt, was nicht?

#### Schritt 4: Astro-Umsetzung
- Astro-Komponenten bauen basierend auf Converter-Output
- Tailwind-Klassen aus dem Parser nutzen
- Contypio Delivery API anbinden fuer dynamische Daten
- Nur Hero-Block + Card-Liste (MVP-Scope)

#### Schritt 5: Visueller Vergleich
- Screenshots der Astro-Umsetzung (gleiche Viewports)
- Pixel-Diff gegen Webstudio-Baseline (Playwright oder manuell)
- Differenz dokumentieren und bewerten

### 4.4 Erfolgskriterien

| Kriterium | Ziel | Messung |
|---|---|---|
| Design ist pixel-perfekt in Webstudio erstellbar | Alle CSS-Properties verfuegbar | Checkliste der genutzten Properties |
| Responsive Design funktioniert | Desktop + Mobile sauber | Screenshots beider Viewports |
| CSS → Tailwind Parser liefert brauchbares Ergebnis | > 80% korrekte Klassen | Manueller Review |
| Astro-Umsetzung weicht minimal ab | < 5% visuelle Differenz | Pixel-Diff Screenshots |
| Workflow ist schneller als Figma → Code | Weniger Rueckfragen | Zeitaufwand in Stunden notieren |
| MVP-Scope reicht als Beweis | Hero + Card-Liste funktionieren | Beide Komponenten live mit Contypio-Daten |

---

## 5. Langfristige Integration

### Stufe 1: Design-Tool (jetzt)
- Webstudio als internes Design-Tool fuer web-werkstatt
- Designer baut Layouts, Entwickler setzt in Astro um
- Kein Kunden-Zugang noetig

### Stufe 2: Komponenten-Bibliothek
- Wiederverwendbare Komponenten in Webstudio erstellen
- Hero-Varianten, Card-Layouts, Navigation-Patterns
- Neue Kunden-Projekte starten mit vorgefertigten Designs
- Export als Astro-Komponenten-Templates

### Stufe 3: Kunden-Design-Tool (optional)
- Kunden koennen einfache Design-Anpassungen selbst machen
- Farben, Bilder, Texte visuell aendern
- Beschraenkter Zugang (nur bestimmte Bereiche editierbar)
- Export → automatisch in Astro-Projekt uebernehmen

**GUARDRAIL: Kein direkter Export in Produktion ohne Dev-Review.**
Jede Design-Aenderung durch Kunden muss vom Entwickler geprueft und
freigegeben werden, bevor sie live geht. Diese Regel darf nicht
aufgeweicht werden — auch nicht "nur fuer kleine Aenderungen".

---

## 6. Risiken & Chancen

### Risiken

| Risiko | Bewertung | Mitigation |
|---|---|---|
| Webstudio ist kleines Team | Mittel | Self-hosted, Open Source — notfalls eigener Fork |
| Export ist kein Tailwind sondern eigenes CSS | Geloest | `css-to-tailwindcss` Parser im Converter |
| Lernkurve fuer Designer | Niedrig | Webstudio ist intuitiv, aehnlich wie Webflow |
| Self-hosted Builder noch experimentell | Mittel | PoC zeigt Stabilitaet |

### Chancen

| Chance | Bewertung |
|---|---|
| Webstudio aktiv entwickelt (Commits, Issues, Roadmap) | Positiv |
| Kleine Community = hohe Sichtbarkeit bei Contypio-Integration | Positiv |
| "Frontend fuer Headless CMS" ist Webstudio's Marketing-Narrativ | Positiv |
| Open Source: kein Vendor Lock-in, Code gehoert uns | Positiv |
| Workflow-Beschleunigung: Design → Code ohne Interpretation | Positiv |
| Einzigartige Kombination: Open Source CMS + Visual Designer + SSG | Positiv |

---

## 7. Einbettung in Loveable Converter Pipeline

Webstudio ist Teil einer groesseren Website-Pipeline (Projekt: `proj_loveable_converter2026`).

### Gesamt-Pipeline

```
1. LOVEABLE (AI-generiertes Rohlayout)
   - Prompt → Vite + React + Tailwind Projekt
   - Schneller Prototyp, grobe Struktur
   - Output: HTML/React Komponenten + Tailwind
   |
   v
2. WEBSTUDIO (Pixel-perfektes Design-Refinement)
   - Loveable-Output importieren (Paste Tailwind HTML)
   - Layout verfeinern: Spacing, Proportionen, Responsive
   - Design-System definieren: Farben, Typo, Abstufungen
   - Komponenten-Bibliothek aufbauen
   - Output: Pixel-perfektes Design als Referenz
   |
   v
3. CONVERTER (proj_loveable_converter2026)
   - CSS → Tailwind via css-to-tailwindcss Parser
   - Schema-driven Block-Mapping (Contypio /content/schema)
   - Astro-Starter als Basis (starters/astro/)
   |
   +---> Astro + Contypio (Headless CMS) — Standard fuer neue Projekte
   +---> Astro + Directus — Fuer komplexe Datenstrukturen
   +---> Astro + Ghost — Fuer Blog-lastige Seiten
   +---> WordPress + Bricks — Fuer Kunden die WordPress wollen
   +---> Next.js + Directus — Fuer App-aehnliche Projekte
   |
   v
4. FERTIGES PROJEKT
   - Self-hosted, performant, DSGVO-konform
   - Redakteur pflegt Inhalte im CMS
   - Designer verfeinert in Webstudio
   - Entwickler deployed via Astro/Docker
```

### Contypio-spezifische Erweiterung

Der Converter muss fuer Contypio folgendes koennen:

1. **Astro-Komponenten generieren** die Contypio SDK (`@contypio/client`) nutzen
2. **Delivery API Endpoints mappen:**
   - Seiten → `GET /content/pages/{slug}`
   - Collections → `GET /content/collections/{key}`
   - Navigation → `GET /content/globals/navigation`
   - Site Settings → `GET /content/globals/site-settings`
3. **Block-Typen unterstuetzen:**
   - Hero, Rich Text, Galerie, Karten, FAQ, CTA → Astro-Komponenten
   - Daten-Blocks (Reisen, Reiseziele) → Collection-Queries
4. **Astro Starter als Basis** (existiert bereits in `starters/astro/`)

---

## 8. Naechste Schritte

1. [ ] **PoC starten** — ir-tours Hero + Card-Liste in Webstudio designen
2. [ ] **Minimalen css-to-tailwind Converter-Prototyp bauen** (eine Section)
3. [ ] **Design-Uebergabe testen** — Converter-Output in Astro-Komponente
4. [ ] **Workflow bewerten** — Schneller/besser als Figma → Code?
5. [ ] **Contypio-Target im Converter** — Astro + Contypio SDK als Output-Option
6. [ ] **Entscheidung** — Als Design-Tool fest in Workflow integrieren?
7. [ ] **Komponenten-Bibliothek** — Wiederverwendbare Designs in Webstudio aufbauen

---

*Dieses Dokument wird nach dem PoC mit Ergebnissen aktualisiert.
Verwandtes Projekt: `proj_loveable_converter2026` (Pipeline-Converter)*
