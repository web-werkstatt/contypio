---
title: "Astro mit CMS verbinden"
icon: "plug"
description: "Schritt-fuer-Schritt Anleitung: Wie eine Astro-Seite Daten vom CMS holt"
section: "Astro-Anbindung"
tags: [astro, anbindung, fetch, integration, seite, tutorial]
order: 10
tips:
  - "Immer Fallback-Defaults definieren, falls CMS nicht erreichbar"
  - "const CMS_URL am Anfang des Frontmatters definieren"
  - "json.data || json - weil Globals die Daten in .data wrappen"
---

## Das Grundprinzip

Jede Astro-Seite holt ihre Inhalte per `fetch()` von der CMS Delivery API.
Das passiert im **Frontmatter** (dem `---`-Block am Anfang der `.astro`-Datei).

```
---
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';
const res = await fetch(`${CMS_URL}/content/globals/mein-global`);
const json = await res.json();
const data = json.data || json;
---

<h1>{data.title}</h1>
```

## Schritt-fuer-Schritt: Neue Seite anbinden

### 1. ENV-Variable pruefen

In `.env` (bzw. `.env.production`) muss stehen:

```
PUBLIC_CMS_URL=https://cms.ir-tours.de
```

### 2. CMS_URL im Frontmatter setzen

```javascript
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';
```

### 3. Fallback-Defaults definieren

**Immer** Default-Werte definieren, damit die Seite auch ohne CMS funktioniert:

```javascript
const defaults = {
  heroGroup: { title: 'MEINE SEITE', subtitle: 'Untertitel' },
  seoGroup: { seoTitle: 'Meine Seite - i+r Tours', seoDescription: '...' },
};
```

### 4. Daten vom CMS laden

```javascript
let settings = defaults;
try {
  const res = await fetch(`${CMS_URL}/content/globals/meine-seite-settings`);
  if (res.ok) {
    const json = await res.json();
    const data = json.data || json;
    settings = { ...defaults, ...data };
  }
} catch { /* Fallback verwenden */ }
```

### 5. Daten im Template verwenden

```html
<PageHero
  title={settings.heroGroup?.title || 'MEINE SEITE'}
  subtitle={settings.heroGroup?.subtitle}
/>
```

## Vollstaendiges Beispiel: Service-Seite

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHero from '../components/PageHero.astro';

const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:8060';

// 1. Defaults definieren
const defaults = {
  heroGroup: { title: 'SERVICE', subtitle: 'Nuetzliche Informationen' },
  introText: 'Damit Ihre Reise ein Genuss wird...',
  serviceCards: [
    { title: 'Auswaertiges Amt', description: '...', link: 'https://...' },
  ],
  seoGroup: { seoTitle: 'Service - i+r Tours' },
};

// 2. CMS-Daten laden (mit Fallback)
let settings = defaults;
try {
  const res = await fetch(`${CMS_URL}/content/globals/service-page-settings`);
  if (res.ok) {
    const json = await res.json();
    const data = json.data || json;
    settings = { ...defaults, ...data };
  }
} catch { /* Fallback */ }

// 3. Felder extrahieren
const hero = settings.heroGroup || defaults.heroGroup;
const cards = settings.serviceCards || defaults.serviceCards;
const seo = settings.seoGroup || defaults.seoGroup;
---

<BaseLayout title={seo.seoTitle}>
  <PageHero title={hero.title} subtitle={hero.subtitle} />

  {cards.map(card => (
    <div>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
    </div>
  ))}
</BaseLayout>
```

## Welchen API-Endpunkt verwende ich?

| Ich brauche... | Endpunkt | Beispiel |
|---|---|---|
| Seiteneinstellungen (Hero, SEO, Inhalt) | `/content/globals/{slug}` | `service-page-settings` |
| Eine Liste von Eintraegen | `/content/collection/{key}` | `reise-themen` |
| Seite mit Sections aus dem CMS | `/content/page?slug={slug}` | `kontakt` |
| Navigation / Site-Settings | `/content/globals/{slug}` | `navigation`, `site-settings` |
