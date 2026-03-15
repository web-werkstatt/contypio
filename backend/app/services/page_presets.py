"""Page presets: predefined section structures for different page types."""

from uuid import uuid4

# --- Page Type definitions ---

PAGE_TYPES = [
    {"key": "homepage", "label": "Homepage", "description": "Startseite mit Hero, Highlights und Vertrauen", "icon": "Sparkles"},
    {"key": "destination", "label": "Zielseite", "description": "Detailseite fuer ein Thema oder Angebot", "icon": "Compass"},
    {"key": "landing", "label": "Landingpage", "description": "Fokussierte Seite fuer Kampagnen und Aktionen", "icon": "Globe"},
    {"key": "magazine", "label": "Magazin", "description": "Artikel, Tipps und Inspiration", "icon": "Newspaper"},
    {"key": "content", "label": "Inhaltsseite", "description": "Flexible Seite mit Text, Bildern und mehr", "icon": "FileText"},
    {"key": "listing", "label": "Listing", "description": "Uebersicht mit Filtern und Suche", "icon": "List"},
    {"key": "blank", "label": "Leere Seite", "description": "Komplett leer - volle Gestaltungsfreiheit", "icon": "File"},
]


def _id(prefix: str) -> str:
    return f"{prefix}{uuid4().hex[:8]}"


def _section(layout: str, blocks_per_col: list[list[dict]]) -> dict:
    columns = []
    for blk_list in blocks_per_col:
        columns.append({
            "id": _id("col_"),
            "blocks": [{"id": _id("blk_"), "blockType": b["blockType"], "data": b.get("data", {})} for b in blk_list],
        })
    return {"id": _id("sec_"), "layout": layout, "background": {"color": "#ffffff"}, "spacing": {"paddingTop": "48px", "paddingBottom": "48px"}, "columns": columns}


def _replace_placeholders(sections: list[dict], metadata: dict) -> list[dict]:
    """Replace {title} and {brand} placeholders in string values."""
    title = metadata.get("title", "")
    brand = metadata.get("brand", "") or title
    import json
    raw = json.dumps(sections)
    raw = raw.replace("{title}", title).replace("{brand}", brand)
    return json.loads(raw)


# --- Preset definitions per page type ---

PRESETS: dict[str, dict[str, dict]] = {
    "homepage": {
        "classic": {
            "label": "Klassisch",
            "description": "Hero + Highlights + Trust-Leiste + Newsletter",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "Willkommen bei {brand}", "subtitle": "Entdecken Sie unser Angebot"}}]]),
                _section("full", [[{"blockType": "featuredTrips", "data": {"headline": "Unsere Empfehlungen", "maxItems": 6}}]]),
                _section("full", [[{"blockType": "trustStrip", "data": {"items": [{"icon": "shield", "text": "Sicher & zuverlaessig"}, {"icon": "star", "text": "Top bewertet"}, {"icon": "phone", "text": "Persoenliche Beratung"}]}}]]),
                _section("full", [[{"blockType": "newsletter", "data": {"headline": "Newsletter abonnieren", "description": "Neuigkeiten direkt in Ihr Postfach"}}]]),
            ],
        },
        "modern": {
            "label": "Modern",
            "description": "Hero-Slider + Kacheln + Magazin-Teaser",
            "sections": lambda: [
                _section("full", [[{"blockType": "heroSlider", "data": {"slides": []}}]]),
                _section("full", [[{"blockType": "destinationTiles", "data": {"headline": "Beliebte Themen", "tiles": []}}]]),
                _section("full", [[{"blockType": "magazineTeaser", "data": {"headline": "Aus unserem Magazin", "maxItems": 3}}]]),
                _section("full", [[{"blockType": "trustStrip", "data": {"items": []}}]]),
            ],
        },
    },
    "destination": {
        "standard": {
            "label": "Standard",
            "description": "Hero + Text + Listing + Inspiration",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "richText", "data": {"html": "<h2>Ueber {title}</h2><p>Beschreibung...</p>"}}]]),
                _section("full", [[{"blockType": "tripListing", "data": {"headline": "Angebote: {title}", "filters": {}}}]]),
                _section("full", [[{"blockType": "inspirationTiles", "data": {"headline": "Inspiration", "tiles": []}}]]),
            ],
        },
        "visual": {
            "label": "Visuell",
            "description": "Galerie + Kacheln + CTA",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "gallery", "data": {"images": []}}]]),
                _section("full", [[{"blockType": "destinationTiles", "data": {"headline": "Entdecken Sie {title}", "tiles": []}}]]),
                _section("full", [[{"blockType": "cta", "data": {"headline": "{title} entdecken", "buttonText": "Jetzt anfragen", "buttonUrl": ""}}]]),
            ],
        },
    },
    "landing": {
        "conversion": {
            "label": "Conversion",
            "description": "Hero + USPs + Highlights + CTA + Trust",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": "Jetzt entdecken"}}]]),
                _section("three-col-equal", [
                    [{"blockType": "cards", "data": {"title": "Qualitaet", "text": "", "icon": "star"}}],
                    [{"blockType": "cards", "data": {"title": "Sicherheit", "text": "", "icon": "shield"}}],
                    [{"blockType": "cards", "data": {"title": "Service", "text": "", "icon": "heart"}}],
                ]),
                _section("full", [[{"blockType": "featuredTrips", "data": {"headline": "Top-Angebote", "maxItems": 4}}]]),
                _section("full", [[{"blockType": "cta", "data": {"headline": "Jetzt buchen", "buttonText": "Zum Angebot", "buttonUrl": ""}}]]),
                _section("full", [[{"blockType": "trustStrip", "data": {"items": []}}]]),
            ],
        },
        "minimal": {
            "label": "Minimal",
            "description": "Hero + Text + CTA",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "richText", "data": {"html": "<p>Inhalt hier einfuegen...</p>"}}]]),
                _section("full", [[{"blockType": "cta", "data": {"headline": "", "buttonText": "Kontakt", "buttonUrl": ""}}]]),
            ],
        },
    },
    "magazine": {
        "editorial": {
            "label": "Editorial",
            "description": "Hero + Magazin-Teaser + Newsletter",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{brand} Magazin", "subtitle": "Inspiration und Tipps"}}]]),
                _section("full", [[{"blockType": "magazineTeaser", "data": {"headline": "Aktuelle Artikel", "maxItems": 6}}]]),
                _section("full", [[{"blockType": "newsletter", "data": {"headline": "Nichts verpassen", "description": "Neue Artikel direkt per E-Mail"}}]]),
            ],
        },
    },
    "content": {
        "standard": {
            "label": "Standard",
            "description": "Hero + Text + Bild",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "richText", "data": {"html": "<p>Inhalt hier einfuegen...</p>"}}]]),
            ],
        },
        "faq": {
            "label": "FAQ",
            "description": "Hero + FAQ-Akkordeon",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "faq", "data": {"items": [{"question": "Frage 1?", "answer": "Antwort..."}]}}]]),
            ],
        },
    },
    "listing": {
        "standard": {
            "label": "Standard",
            "description": "Hero + Listing mit Filtern",
            "sections": lambda: [
                _section("full", [[{"blockType": "hero", "data": {"title": "{title}", "subtitle": ""}}]]),
                _section("full", [[{"blockType": "tripListing", "data": {"headline": "", "filters": {}}}]]),
            ],
        },
    },
}


def get_page_types() -> list[dict]:
    return PAGE_TYPES


def get_presets_for_type(page_type_key: str) -> list[dict]:
    type_presets = PRESETS.get(page_type_key, {})
    return [{"key": k, "label": v["label"], "description": v["description"]} for k, v in type_presets.items()]


def generate_sections(preset_key: str, metadata: dict) -> list[dict]:
    """Generate sections from a preset key like 'homepage:classic'.

    Returns list of section dicts ready for Page creation.
    """
    parts = preset_key.split(":", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid preset_key format: {preset_key}. Expected 'type:style'.")
    page_type, style = parts
    type_presets = PRESETS.get(page_type)
    if not type_presets:
        raise ValueError(f"Unknown page type: {page_type}")
    preset = type_presets.get(style)
    if not preset:
        raise ValueError(f"Unknown preset style '{style}' for page type '{page_type}'")

    sections = preset["sections"]()  # call lambda to generate fresh IDs
    return _replace_placeholders(sections, metadata)
