"""
Node-Baum → CMS Sections/Blocks.
Pattern-Matching auf Node-Struktur (nicht CSS-Klassen).
Output: Exakt das bestehende Section/Column/Block-Format.
"""
import re
import uuid

from .node_schema import Node, NodeType


def _new_id() -> str:
    return str(uuid.uuid4())[:8]


def convert_tree_to_sections(tree: Node) -> list[dict]:
    """Konvertiert einen PAGE-Node in CMS-Sections."""
    sections: list[dict] = []
    for child in tree.children:
        section = _convert_section(child)
        if section:
            sections.append(section)
    return sections


def _convert_section(node: Node) -> dict | None:
    """Konvertiert einen SECTION/GROUP-Node in eine CMS-Section."""
    blocks = _convert_node_to_blocks(node)
    if not blocks:
        return None

    layout = _detect_layout(node)
    columns = [{"id": _new_id(), "blocks": blocks}]
    return {"id": _new_id(), "layout": layout, "columns": columns}


def _detect_layout(node: Node) -> str:
    """Layout aus GRID-Knoten ableiten."""
    grids = [c for c in node.children if c.type == NodeType.GRID]
    if not grids:
        return "full"

    grid = grids[0]
    cols = grid.props.get("columns", 1)
    if cols >= 4:
        return "four-col-equal"
    if cols == 3:
        return "three-col-equal"
    if cols == 2:
        return "two-col-equal"
    return "full"


_MAX_DEPTH = 15


def _convert_node_to_blocks(node: Node, depth: int = 0) -> list[dict]:
    """Konvertiert einen Node (und seine Kinder) in CMS-Blöcke."""
    if depth > _MAX_DEPTH:
        # Fallback: Gesamten Inhalt als richText
        text = _collect_text(node)
        if text:
            return [_make_block("richText", {"title": "", "content": f"<p>{text}</p>"})]
        return []

    blocks: list[dict] = []

    children = node.children if node.type in (
        NodeType.SECTION, NodeType.GROUP, NodeType.PAGE
    ) else [node]

    i = 0
    while i < len(children):
        child = children[i]
        block = _match_pattern(child, children, i, depth)
        if block:
            if isinstance(block["block"], list):
                blocks.extend(block["block"])
            else:
                blocks.append(block["block"])
            i += block.get("consumed", 1)
        else:
            i += 1

    return blocks


def _match_pattern(node: Node, siblings: list[Node], idx: int, depth: int = 0) -> dict | None:
    """Pattern-Matching: Node + Kontext → CMS-Block."""
    # FAQ: 2+ DETAILS-Kinder oder DETAILS selbst in Gruppe
    result = _match_faq(node, siblings, idx)
    if result:
        return result

    # Gallery: GRID mit 3+ IMAGE/FIGURE
    result = _match_gallery(node)
    if result:
        return result

    # Cards: GRID mit 2+ GROUP(HEADING+PARAGRAPH+...)
    result = _match_cards(node)
    if result:
        return result

    # CTA: HEADING + PARAGRAPH + BUTTON/LINK
    result = _match_cta(node, siblings, idx)
    if result:
        return result

    # Newsletter: FORM mit wenig Feldern + EMAIL
    result = _match_newsletter(node)
    if result:
        return result

    # Form: FORM mit vielen Feldern
    result = _match_form(node)
    if result:
        return result

    # Video: IFRAME(youtube/vimeo) oder VIDEO
    result = _match_video(node)
    if result:
        return result

    # Map: IFRAME(maps)
    result = _match_map(node)
    if result:
        return result

    # Table
    result = _match_table(node)
    if result:
        return result

    # Image
    result = _match_image(node)
    if result:
        return result

    # CSS-Hint-basierte Erkennung (Slider, Iconboxen etc.)
    result = _match_css_hint(node)
    if result:
        return result

    # RichText: Aufeinanderfolgende HEADING/PARAGRAPH/LIST
    result = _match_richtext(node, siblings, idx)
    if result:
        return result

    # GROUP/GRID mit Kindern: rekursiv verarbeiten
    if node.type in (NodeType.GROUP, NodeType.GRID) and node.children:
        sub_blocks = _convert_node_to_blocks(node, depth + 1)
        if sub_blocks:
            return {"block": sub_blocks if len(sub_blocks) > 1 else sub_blocks[0], "consumed": 1}

    return None


# ─── Pattern Matchers ─────────────────────────────────────────


def _match_faq(node: Node, siblings: list[Node], idx: int) -> dict | None:
    """FAQ: Gruppe mit 2+ DETAILS oder aufeinanderfolgende DETAILS."""
    # Gruppe mit DETAILS-Kindern
    if node.type in (NodeType.GROUP, NodeType.GRID, NodeType.SECTION):
        details = [c for c in node.children if c.type == NodeType.DETAILS]
        if len(details) >= 2:
            items = [_details_to_faq_item(d) for d in details]
            return {"block": _make_block("faq", {"title": "", "items": items}), "consumed": 1}

    # Einzelnes DETAILS: sammle aufeinanderfolgende
    if node.type == NodeType.DETAILS:
        details_nodes = [node]
        j = idx + 1
        while j < len(siblings) and siblings[j].type == NodeType.DETAILS:
            details_nodes.append(siblings[j])
            j += 1
        if len(details_nodes) >= 2:
            items = [_details_to_faq_item(d) for d in details_nodes]
            return {"block": _make_block("faq", {"title": "", "items": items}), "consumed": j - idx}
        # Einzelnes DETAILS als richText
        return _make_richtext_from_node(node)

    return None


def _details_to_faq_item(node: Node) -> dict:
    """Konvertiert einen DETAILS-Node in ein FAQ-Item."""
    question = ""
    answer_parts: list[str] = []
    for child in node.children:
        if child.type == NodeType.HEADING and not question:
            question = child.props.get("text", "")
        else:
            html = child.props.get("html", child.props.get("text", ""))
            if html:
                answer_parts.append(str(html))
    return {"id": _new_id(), "question": question, "answer": " ".join(answer_parts)}


def _match_gallery(node: Node) -> dict | None:
    """Gallery: GRID mit 3+ direkten IMAGE/FIGURE-Kindern."""
    if node.type != NodeType.GRID:
        return None
    images = [c for c in node.children if c.type in (NodeType.IMAGE, NodeType.FIGURE)]
    if len(images) < 3:
        return None
    img_data = []
    for img in images:
        if img.type == NodeType.IMAGE:
            img_data.append({"src": img.props.get("src", ""), "alt": img.props.get("alt", "")})
        elif img.type == NodeType.FIGURE:
            inner = next((c for c in img.children if c.type == NodeType.IMAGE), None)
            if inner:
                img_data.append({"src": inner.props.get("src", ""), "alt": inner.props.get("alt", "")})
    return {"block": _make_block("gallery", {"title": "", "images": img_data, "layout": "grid"}), "consumed": 1}


def _match_cards(node: Node) -> dict | None:
    """Cards: GRID mit 2+ GROUP-Kinder die HEADING+PARAGRAPH enthalten."""
    if node.type != NodeType.GRID:
        return None
    card_groups = []
    for child in node.children:
        if child.type != NodeType.GROUP:
            continue
        has_heading = child.has_child_type(NodeType.HEADING)
        has_content = child.has_child_type(NodeType.PARAGRAPH) or child.has_child_type(NodeType.IMAGE)
        if has_heading and has_content:
            card_groups.append(child)
    if len(card_groups) < 2:
        return None
    items = []
    for cg in card_groups:
        heading = next((c for c in cg.children if c.type == NodeType.HEADING), None)
        para = next((c for c in cg.children if c.type == NodeType.PARAGRAPH), None)
        img = next((c for c in cg.children if c.type == NodeType.IMAGE), None)
        link = next((c for c in cg.children if c.type in (NodeType.LINK, NodeType.BUTTON)), None)
        items.append({
            "id": _new_id(),
            "title": heading.props.get("text", "") if heading else "",
            "text": para.props.get("text", "") if para else "",
            "imageId": "",
            "image": img.props.get("src", "") if img else "",
            "href": link.props.get("href", "") if link else "",
        })
    return {"block": _make_block("cards", {"title": "", "items": items}), "consumed": 1}


def _match_cta(node: Node, siblings: list[Node], idx: int) -> dict | None:
    """CTA: HEADING gefolgt von PARAGRAPH + BUTTON/LINK."""
    if node.type != NodeType.HEADING:
        return None
    # Schaue voraus: PARAGRAPH + BUTTON/LINK
    remaining = siblings[idx + 1:]
    para = next((n for n in remaining[:2] if n.type == NodeType.PARAGRAPH), None)
    btn = next((n for n in remaining[:3] if n.type in (NodeType.BUTTON, NodeType.LINK)), None)
    if not btn:
        return None
    consumed = 1
    elements_consumed = [id(node)]
    if para:
        elements_consumed.append(id(para))
    elements_consumed.append(id(btn))
    # Zähle consumed korrekt
    for j, sib in enumerate(siblings[idx:idx + 4]):
        if id(sib) in elements_consumed:
            consumed = j + 1
    return {
        "block": _make_block("cta", {
            "title": node.props.get("text", ""),
            "text": para.props.get("text", "") if para else "",
            "buttonLabel": btn.props.get("text", ""),
            "buttonHref": btn.props.get("href", ""),
            "variant": "primary",
        }),
        "consumed": consumed,
    }


def _match_newsletter(node: Node) -> dict | None:
    """Newsletter: FORM mit wenig Feldern und email-Input."""
    if node.type != NodeType.FORM:
        return None
    if not node.props.get("has_email"):
        return None
    if node.props.get("field_count", 0) > 4:
        return None
    return {"block": _make_block("newsletter", {"title": "", "subtitle": ""}), "consumed": 1}


def _match_form(node: Node) -> dict | None:
    """Form: FORM mit vielen Feldern."""
    if node.type != NodeType.FORM:
        return None
    fields = []
    for child in node.children:
        if child.type == NodeType.INPUT:
            fields.append({
                "label": child.props.get("label", ""),
                "type": child.props.get("input_type", "text"),
                "name": child.props.get("name", ""),
                "required": child.props.get("required", False),
            })
    return {
        "block": _make_block("form", {
            "title": "",
            "fields": fields,
            "hint": f"Formular mit {len(fields)} Feldern",
        }),
        "consumed": 1,
    }


def _match_video(node: Node) -> dict | None:
    """Video: VIDEO-Tag oder IFRAME mit YouTube/Vimeo."""
    if node.type == NodeType.VIDEO:
        return {
            "block": _make_block("video", {"url": node.props.get("src", ""), "title": ""}),
            "consumed": 1,
        }
    if node.type == NodeType.IFRAME and node.props.get("iframe_type") == "youtube":
        return {
            "block": _make_block("video", {"url": node.props.get("src", ""), "title": ""}),
            "consumed": 1,
        }
    return None


def _match_map(node: Node) -> dict | None:
    """Map: IFRAME mit Google Maps / OpenStreetMap."""
    if node.type == NodeType.IFRAME and node.props.get("iframe_type") == "map":
        return {
            "block": _make_block("map", {"address": "", "provider": "osm"}),
            "consumed": 1,
        }
    return None


def _match_table(node: Node) -> dict | None:
    """Table: TABLE-Node."""
    if node.type != NodeType.TABLE:
        return None
    headers: list[str] = []
    rows: list[list[str]] = []
    for row_node in node.children:
        cells = [c.props.get("text", "") for c in row_node.children]
        if any(c.props.get("is_header") for c in row_node.children):
            headers = cells
        else:
            rows.append(cells)
    return {
        "block": _make_block("table", {
            "title": "",
            "headers": headers,
            "rows": rows,
            "striped": True,
            "responsive": True,
            "caption": "",
        }),
        "consumed": 1,
    }


def _match_image(node: Node) -> dict | None:
    """Einzelbild: IMAGE oder FIGURE."""
    if node.type == NodeType.IMAGE:
        return {
            "block": _make_block("image", {
                "alt": node.props.get("alt", ""),
                "caption": "",
                "link": "",
            }),
            "consumed": 1,
        }
    if node.type == NodeType.FIGURE:
        img = next((c for c in node.children if c.type == NodeType.IMAGE), None)
        caption_node = next((c for c in node.children if c.type == NodeType.PARAGRAPH), None)
        return {
            "block": _make_block("image", {
                "alt": img.props.get("alt", "") if img else "",
                "caption": caption_node.props.get("text", "") if caption_node else "",
                "link": "",
            }),
            "consumed": 1,
        }
    return None


def _match_richtext(node: Node, siblings: list[Node], idx: int) -> dict | None:
    """RichText: Aufeinanderfolgende HEADING/PARAGRAPH/LIST."""
    if node.type not in (NodeType.HEADING, NodeType.PARAGRAPH, NodeType.LIST):
        return None

    # Spezialisierte Typen, die einen eigenen Block bekommen
    specialized_types = {
        NodeType.FORM, NodeType.IFRAME, NodeType.TABLE, NodeType.GRID,
        NodeType.DETAILS, NodeType.VIDEO, NodeType.BUTTON, NodeType.LINK,
        NodeType.IMAGE, NodeType.FIGURE,
    }

    # Wenn ein HEADING direkt vor einem spezialisierten Block steht,
    # nicht als richText erkennen (der spezialisierte Block bekommt den Title)
    if node.type == NodeType.HEADING:
        next_idx = idx + 1
        # Überspringe optionale Paragraphs
        while next_idx < len(siblings) and siblings[next_idx].type == NodeType.PARAGRAPH:
            next_idx += 1
        if next_idx < len(siblings) and siblings[next_idx].type in specialized_types:
            return None

    group = [node]
    j = idx + 1
    while j < len(siblings) and siblings[j].type in (
        NodeType.HEADING, NodeType.PARAGRAPH, NodeType.LIST
    ):
        # Stoppe bei HEADING wenn danach BUTTON kommt (könnte CTA sein)
        if siblings[j].type == NodeType.HEADING and j + 1 < len(siblings):
            next_sib = siblings[j + 1]
            if next_sib.type in (NodeType.BUTTON, NodeType.LINK):
                break
        # Stoppe vor spezialisierten Blöcken
        if j + 1 < len(siblings) and siblings[j + 1].type in specialized_types:
            break
        group.append(siblings[j])
        j += 1

    content_parts: list[str] = []
    title = ""
    for n in group:
        if n.type == NodeType.HEADING and not title:
            title = n.props.get("text", "")
        html = n.props.get("html", "")
        if html:
            content_parts.append(html)
        elif n.type == NodeType.LIST:
            tag = "ol" if n.props.get("ordered") else "ul"
            items_html = "".join(
                f"<li>{it.get('text', '')}</li>" for it in n.props.get("items", [])
            )
            content_parts.append(f"<{tag}>{items_html}</{tag}>")
        else:
            text = n.props.get("text", "")
            if text:
                content_parts.append(f"<p>{text}</p>")

    return {
        "block": _make_block("richText", {
            "title": title,
            "content": "\n".join(content_parts),
        }),
        "consumed": j - idx,
    }


def _match_css_hint(node: Node) -> dict | None:
    """CSS-Klassen-basierte Erkennung als Fallback für div-basierte CMS-Strukturen."""
    css = node.props.get("css_classes", "")
    # CSS-Klassen aus allen Nachkommen (max 2 Ebenen) sammeln
    descendant_css_parts = [css]
    for child in node.children:
        cc = child.props.get("css_classes", "")
        if cc:
            descendant_css_parts.append(cc)
        for gc in child.children:
            gcc = gc.props.get("css_classes", "")
            if gcc:
                descendant_css_parts.append(gcc)
    combined_css = " ".join(descendant_css_parts)
    if not combined_css.strip():
        return None
    css = combined_css

    # Slider (Swiper, Revolution Slider, etc.) — nur wenn primärer Inhalt
    own_css = node.props.get("css_classes", "")
    if re.search(r"slider|swiper|carousel|cc_reisen_slider", own_css, re.IGNORECASE):
        return {
            "block": _make_block("heroSlider", {
                "source": "api",
                "hint": "Slider (externe API)",
            }),
            "consumed": 1,
        }
    # Slider als einziges/dominantes Kind
    slider_children = [c for c in node.children if re.search(r"slider|swiper", c.props.get("css_classes", ""), re.IGNORECASE)]
    if slider_children and len(node.children) <= 2:
        return {
            "block": _make_block("heroSlider", {
                "source": "api",
                "hint": "Slider (externe API)",
            }),
            "consumed": 1,
        }

    # Iconbox-Gruppen → Cards
    if re.search(r"ce_iconbox", css, re.IGNORECASE):
        # Rekursiv äußerste ce_iconbox-Nodes finden
        iconbox_nodes = _find_outermost_by_css(node, r"ce_iconbox")
        items: list[dict] = []
        seen_titles: set[str] = set()
        title = ""
        # Titel aus Heading-Geschwistern extrahieren
        for child in node.children:
            if child.type == NodeType.HEADING:
                title = child.props.get("text", "")
                break
        # Heading/Text aus jeder Iconbox extrahieren
        for ib_node in iconbox_nodes:
            headings = ib_node.find_all(NodeType.HEADING)
            paras = ib_node.find_all(NodeType.PARAGRAPH)
            item_title = headings[0].props.get("text", "") if headings else ""
            item_text = paras[0].props.get("text", "") if paras else ""
            if item_title and item_title not in seen_titles:
                seen_titles.add(item_title)
                items.append({"id": _new_id(), "title": item_title, "text": item_text, "imageId": "", "href": ""})
        if items:
            return {"block": _make_block("cards", {"title": title, "items": items}), "consumed": 1}

    # Gallery-Container
    if re.search(r"ce_gallery|gallery-grid", css, re.IGNORECASE):
        images = node.find_all(NodeType.IMAGE)
        if len(images) >= 2:
            img_data = [{"src": img.props.get("src", ""), "alt": img.props.get("alt", "")} for img in images]
            return {"block": _make_block("gallery", {"title": "", "images": img_data, "layout": "grid"}), "consumed": 1}

    # Hintergrund-Bild mit Text (ce_bgimage) → CTA
    if re.search(r"ce_bgimage", css, re.IGNORECASE):
        headings = node.find_all(NodeType.HEADING)
        paras = node.find_all(NodeType.PARAGRAPH)
        buttons = node.find_all(NodeType.BUTTON) + node.find_all(NodeType.LINK)
        title = headings[0].props.get("text", "") if headings else ""
        text = paras[0].props.get("text", "") if paras else ""
        if buttons:
            return {
                "block": _make_block("cta", {
                    "title": title,
                    "text": text,
                    "buttonLabel": buttons[0].props.get("text", ""),
                    "buttonHref": buttons[0].props.get("href", ""),
                    "variant": "primary",
                }),
                "consumed": 1,
            }
        if title:
            return {
                "block": _make_block("richText", {"title": title, "content": f"<p>{text}</p>" if text else ""}),
                "consumed": 1,
            }

    # Reise-Listing (CustomCatalog)
    if re.search(r"cc_reisen|mod_customcatalog|top_objects", css, re.IGNORECASE):
        return {
            "block": _make_block("featuredTrips", {
                "source": "api",
                "hint": "Reiseangebote (externe API)",
                "maxItems": 9,
            }),
            "consumed": 1,
        }

    return None


def _find_outermost_by_css(node: Node, pattern: str) -> list[Node]:
    """Findet die äußersten Nodes deren css_classes dem Pattern entsprechen."""
    results: list[Node] = []
    css = node.props.get("css_classes", "")
    if re.search(pattern, css, re.IGNORECASE):
        results.append(node)
        return results  # Nicht tiefer suchen (äußerster Treffer)
    for child in node.children:
        results.extend(_find_outermost_by_css(child, pattern))
    return results


def _make_richtext_from_node(node: Node) -> dict:
    """Fallback: Einzelnen Node als richText."""
    text = node.props.get("text", "")
    html = node.props.get("html", text)
    return {
        "block": _make_block("richText", {"title": "", "content": str(html)}),
        "consumed": 1,
    }


def _collect_text(node: Node) -> str:
    """Sammelt rekursiv allen Text aus einem Node-Baum."""
    parts: list[str] = []
    text = node.props.get("text", "")
    if text:
        parts.append(text)
    for child in node.children:
        child_text = _collect_text(child)
        if child_text:
            parts.append(child_text)
    return " ".join(parts)


def _make_block(block_type: str, data: dict) -> dict:
    """Erstellt ein CMS-Block-Dict."""
    return {"id": _new_id(), "blockType": block_type, "data": data}
