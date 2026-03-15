"""Automatically convert Global content into Page sections.

When a page matches a global by naming convention (slug "agb" -> global
"agb-page-settings"), the global's structured data is transformed into
sections with richText blocks and written directly into the page.

This eliminates the need for separate Globals for page content - everything
lives in the page itself and is editable in the Section Editor.
"""

from __future__ import annotations

import logging
import uuid as uuid_mod

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.global_config import CmsGlobal
from app.models.page import CmsPage

logger = logging.getLogger("cms")

# Mapping: page slug -> global slug
PAGE_GLOBAL_MAP = {
    "agb": "agb-page-settings",
    "datenschutz": "datenschutz-page-settings",
    "impressum": "impressum-page-settings",
    "kontakt": "kontakt-page-settings",
    "service": "service-page-settings",
    "home": "homepage-layout",
}


def _section(sec_id: str, blocks: list[dict], layout: str = "full") -> dict:
    return {
        "id": sec_id,
        "layout": layout,
        "background": {"color": "#ffffff", "image": ""},
        "spacing": {"paddingTop": "48px", "paddingBottom": "48px"},
        "columns": [{"id": f"{sec_id}_col", "blocks": blocks}],
    }


def _richtext(blk_id: str, title: str, content: str) -> dict:
    return {"id": blk_id, "blockType": "richText", "data": {"title": title, "content": content}}


def _convert_agb(data: dict) -> tuple[list[dict], dict, dict]:
    """Convert AGB global into sections. Returns (sections, hero, seo).

    Groups all paragraphs into ONE section with multiple richText blocks.
    """
    blocks = []
    intro = data.get("introGroup", {})
    if intro.get("text"):
        blocks.append(_richtext("agb_intro_b", "", intro["text"]))
    for i, sec in enumerate(data.get("sections", [])):
        title = f"{sec.get('nr', i+1)}. {sec.get('title', '')}"
        blocks.append(_richtext(f"agb_{i}_b", title, sec.get("content", "")))
    fn = data.get("footerNote", {})
    if fn:
        blocks.append(_richtext("agb_fn_b", "", f"Stand: {fn.get('stand', '')}\n{fn.get('veranstalter', '')}"))

    sections = [_section("agb_content", blocks)] if blocks else []
    hero_g = data.get("heroGroup", {})
    seo_g = data.get("seoGroup", {})
    return sections, _hero(hero_g), _seo(seo_g)


def _convert_datenschutz(data: dict) -> tuple[list[dict], dict, dict]:
    blocks = []
    ver = data.get("verantwortlicherGroup", {})
    if ver:
        blocks.append(_richtext("ds_ver_b", "1. Verantwortlicher",
                       f"Email: {ver.get('email','')}\nTelefon: {ver.get('telefon','')}\nAdresse: {ver.get('adresse','')}"))
    for i, sec in enumerate(data.get("sections", [])):
        blocks.append(_richtext(f"ds_{i}_b", sec.get("title", ""), sec.get("content", "")))
    kb = data.get("kontaktBox", {})
    if kb.get("text"):
        blocks.append(_richtext("ds_kb_b", "Kontakt Datenschutz", kb["text"]))

    sections = [_section("ds_content", blocks)] if blocks else []
    return sections, _hero(data.get("heroGroup", {})), _seo(data.get("seoGroup", {}))


def _convert_impressum(data: dict) -> tuple[list[dict], dict, dict]:
    blocks = []
    anb = data.get("anbieterGroup", {})
    if anb:
        blocks.append(_richtext("imp_anb_b", "Angaben gemaess § 5 TMG",
                       f"{anb.get('firmenname','')}\n{anb.get('strasse','')}\n{anb.get('plzOrt','')}"))
    kon = data.get("kontaktGroup", {})
    if kon:
        blocks.append(_richtext("imp_kon_b", "Kontakt",
                       f"Telefon: {kon.get('telefon','')}\nMobil: {kon.get('mobil','')}\nEmail: {kon.get('email','')}\nWeb: {kon.get('web','')}"))
    if data.get("ustIdNr"):
        blocks.append(_richtext("imp_ust_b", "Umsatzsteuer-ID", f"USt-IdNr.: {data['ustIdNr']}"))
    ver = data.get("verantwortlicherGroup", {})
    if ver:
        blocks.append(_richtext("imp_ver_b", "Verantwortlich fuer den Inhalt",
                       f"{ver.get('name','')}\n{ver.get('strasse','')}\n{ver.get('plzOrt','')}"))
    for field, title in [
        ("haftungInhalte", "Haftung fuer Inhalte"),
        ("haftungLinks", "Haftung fuer Links"),
        ("urheberrecht", "Urheberrecht"),
        ("bildnachweise", "Bildnachweise"),
    ]:
        if data.get(field):
            blocks.append(_richtext(f"imp_{field}_b", title, data[field]))
    ss = data.get("streitschlichtungGroup", {})
    if ss:
        blocks.append(_richtext("imp_ss_b", "Streitschlichtung", f"{ss.get('osText','')}\n\n{ss.get('vsText','')}"))

    sections = [_section("imp_content", blocks)] if blocks else []
    return sections, {"h1": data.get("heroTitle", "Impressum")}, _seo(data.get("seoGroup", {}))


def _convert_kontakt(data: dict) -> tuple[list[dict], dict, dict]:
    blocks = []
    intro = f"{data.get('sectionTitle', '')}\n\n{data.get('introText', '')}"
    blocks.append(_richtext("kon_intro_b", "Kontakt", intro))
    ki = data.get("kontaktInfo", {})
    if ki:
        info = f"**Telefon:** {ki.get('telefon','')}\n**Mobil:** {ki.get('mobil','')}\n**Fax:** {ki.get('fax','')}\n**Email:** {ki.get('email','')}\n**Adresse:** {ki.get('adresse','')}"
        blocks.append(_richtext("kon_info_b", "Kontaktdaten", info))
    for i, tc in enumerate(data.get("teamContacts", [])):
        text = f"**{tc.get('name','')}** - {tc.get('role','')}\nTel: {tc.get('telefon','')}\nEmail: {tc.get('email','')}"
        blocks.append(_richtext(f"kon_tc_{i}_b", "", text))
    fg = data.get("formGroup", {})
    if fg.get("formText"):
        blocks.append(_richtext("kon_form_b", "Reiseanfrage", fg["formText"]))

    sections = [_section("kon_content", blocks)] if blocks else []
    return sections, _hero(data.get("heroGroup", {})), _seo(data.get("seoGroup", {}))


def _convert_service(data: dict) -> tuple[list[dict], dict, dict]:
    blocks = []
    if data.get("introText"):
        blocks.append(_richtext("svc_intro_b", "", data["introText"]))
    for i, card in enumerate(data.get("serviceCards", [])):
        desc = card.get("description", "")
        if card.get("link"):
            desc += f"\n\n[Link]({card['link']})"
        blocks.append(_richtext(f"svc_{i}_b", card.get("title", ""), desc))
    cta = data.get("ctaGroup", {})
    if cta.get("text"):
        blocks.append(_richtext("svc_cta_b", "Fragen?", cta["text"]))

    sections = [_section("svc_content", blocks)] if blocks else []
    return sections, _hero(data.get("heroGroup", {})), _seo(data.get("seoGroup", {}))


def _lexical_to_text(node: dict) -> str:
    """Extract plain text from Lexical rich text JSON."""
    if not node or not isinstance(node, dict):
        return ""
    root = node.get("root", node)
    parts: list[str] = []
    for child in root.get("children", []):
        for text_node in child.get("children", []):
            if text_node.get("text"):
                parts.append(text_node["text"])
        parts.append("\n")
    return "\n".join(parts).strip()


def _convert_homepage(data: dict) -> tuple[list[dict], dict, dict]:
    """Convert homepage-layout global into sections."""
    blocks = []
    for block in data.get("layout", []):
        bt = block.get("blockType", "")
        if bt == "heroSlider":
            blocks.append(_richtext("hp_hero_b", "Hero Slider",
                          "Automatischer Bild-Slider (wird von Astro gerendert)"))
        elif bt == "welcomeSection":
            heading = block.get("heading", "")
            sub = block.get("subheading", "")
            body = _lexical_to_text(block.get("bodyText", {}))
            cta = block.get("ctaText", "")
            cta_link = block.get("ctaLink", "")
            content = f"**{sub}**\n\n{body}"
            if cta:
                content += f"\n\n[{cta}]({cta_link})"
            blocks.append(_richtext("hp_welcome_b", heading, content))
        elif bt == "travelGrid":
            heading = block.get("heading", "")
            max_cards = block.get("maxCards", 9)
            blocks.append(_richtext("hp_grid_b", heading,
                          f"Reise-Kacheln (max. {max_cards} Karten, automatisch aus Reisedaten)"))
        elif bt == "testimonials":
            blocks.append(_richtext("hp_testi_b", "Kundenstimmen",
                          "Testimonial-Karussell (automatisch)"))
        elif bt == "aboutSection":
            heading = block.get("heading", "")
            body = _lexical_to_text(block.get("bodyText", {}))
            blocks.append(_richtext("hp_about_b", heading, body))
        elif bt == "serviceSection":
            heading = block.get("heading", "")
            cards = block.get("cards", [])
            content_parts = []
            for card in cards:
                title = card.get("title", "")
                desc = card.get("description", "")
                content_parts.append(f"**{title}**\n{desc}")
            blocks.append(_richtext("hp_service_b", heading, "\n\n".join(content_parts)))
        else:
            blocks.append(_richtext(f"hp_{bt}_b", bt, "(Block wird von Astro gerendert)"))

    sections = [_section("hp_content", blocks)] if blocks else []
    return sections, {"h1": data.get("title", "Homepage")}, {}


def _hero(group: dict) -> dict:
    h: dict = {}
    if group.get("title"):
        h["h1"] = group["title"]
    if group.get("subtitle"):
        h["subline"] = group["subtitle"]
    return h


def _seo(group: dict) -> dict:
    s: dict = {}
    if group.get("seoTitle"):
        s["title"] = group["seoTitle"]
    if group.get("seoDescription"):
        s["description"] = group["seoDescription"]
    return s


CONVERTERS = {
    "agb": _convert_agb,
    "datenschutz": _convert_datenschutz,
    "home": _convert_homepage,
    "impressum": _convert_impressum,
    "kontakt": _convert_kontakt,
    "service": _convert_service,
}


def _build_portal_sections(page: CmsPage) -> list[dict]:
    """Build sections from a portal/listing page's hero data.

    Groups all portal blocks into ONE section.
    """
    hero = page.hero or {}
    blocks = []

    # Hero block with h1 and subline
    h1 = hero.get("h1", page.title)
    subline = hero.get("subline", "")
    blocks.append(_richtext(f"{page.slug}_hero_b", h1, subline))

    # Listing config as info block
    listing = hero.get("listing", {})
    if listing:
        config_lines = []
        if listing.get("preType"):
            config_lines.append(f"**Filter:** {listing['preType']}")
        if listing.get("defaultSort"):
            config_lines.append(f"**Sortierung:** {listing['defaultSort']}")
        if listing.get("pageSize"):
            config_lines.append(f"**Pro Seite:** {listing['pageSize']}")
        if config_lines:
            blocks.append(_richtext(f"{page.slug}_listing_b", "Listing-Konfiguration", "\n".join(config_lines)))

    # Curation / Featured
    curation = hero.get("curation", {})
    if curation.get("showFeaturedBlock"):
        featured_title = curation.get("featuredBlockTitle", "Empfehlungen")
        blocks.append(_richtext(f"{page.slug}_feat_b", featured_title,
                      "Ausgewaehlte Reisen werden hier automatisch angezeigt."))

    return [_section(f"{page.slug}_content", blocks)] if blocks else []


async def sync_globals_to_pages(
    tenant_id: uuid_mod.UUID, db: AsyncSession, *, force: bool = False
) -> dict:
    """Convert globals into page sections AND populate empty portal pages.
    Returns a summary of what was done.
    If force=True, also re-generates portal pages that already have sections.
    """
    results = {"synced": [], "skipped": [], "errors": []}

    # 1. Globals -> Content pages
    for page_slug, global_slug in PAGE_GLOBAL_MAP.items():
        converter = CONVERTERS.get(page_slug)
        if not converter:
            continue

        g_result = await db.execute(
            select(CmsGlobal).where(
                CmsGlobal.slug == global_slug,
                CmsGlobal.tenant_id == tenant_id,
            )
        )
        g = g_result.scalar_one_or_none()
        if not g or not g.data:
            results["skipped"].append({"page": page_slug, "reason": f"Global '{global_slug}' nicht gefunden"})
            continue

        p_result = await db.execute(
            select(CmsPage).where(
                CmsPage.slug == page_slug,
                CmsPage.tenant_id == tenant_id,
            )
        )
        page = p_result.scalar_one_or_none()
        if not page:
            results["skipped"].append({"page": page_slug, "reason": "Seite nicht gefunden"})
            continue

        try:
            sections, hero, seo = converter(g.data)
            page.sections = sections
            if hero:
                page.hero = hero
            if seo:
                page.seo = seo
            results["synced"].append({
                "page": page_slug,
                "sections": len(sections),
                "source": f"global:{global_slug}",
            })
        except Exception as e:
            results["errors"].append({"page": page_slug, "error": str(e)})

    # 2. Portal/listing pages with hero but no sections
    all_pages = await db.execute(
        select(CmsPage).where(CmsPage.tenant_id == tenant_id)
    )
    for page in all_pages.scalars().all():
        if page.slug in PAGE_GLOBAL_MAP:
            continue  # already handled above
        if page.sections and not force:
            continue  # already has content
        if not page.hero:
            continue  # nothing to convert

        try:
            sections = _build_portal_sections(page)
            if sections:
                page.sections = sections
                results["synced"].append({
                    "page": page.slug,
                    "sections": len(sections),
                    "source": "hero",
                })
        except Exception as e:
            results["errors"].append({"page": page.slug, "error": str(e)})

    await db.flush()
    return results
