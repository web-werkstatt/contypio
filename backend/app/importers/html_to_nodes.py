"""
HTML → Semantischer Node-Baum.
Klassifiziert HTML-Elemente primär über Tag-Namen, nicht CSS-Klassen.
CSS-Klassen dienen nur als optionaler Hint bei <div>-Elementen.
"""
import re

from bs4 import BeautifulSoup, NavigableString, Tag

from .node_schema import Node, NodeType


def parse_html_to_tree(html: str) -> Node:
    """Parst HTML-String in einen semantischen Node-Baum."""
    soup = BeautifulSoup(html, "html.parser")
    _remove_noise(soup)

    main_el = soup.find("main") or soup.find("body")
    if not isinstance(main_el, Tag):
        main_el = soup  # type: ignore[assignment]
    sections = _find_sections(main_el)  # type: ignore[arg-type]

    children = [_convert_element(s) for s in sections]
    children = [c for c in children if c is not None]

    return Node(type=NodeType.PAGE, children=children)


def _remove_noise(soup: BeautifulSoup) -> None:
    """Entfernt Navigation, Footer, Modals, Scripts etc."""
    for tag in soup.find_all(["nav", "footer", "header", "script", "style", "link", "noscript"]):
        tag.decompose()
    for tag in soup.find_all(class_=re.compile(r"modal|cookie|mobile-nav")):
        tag.decompose()
    for tag in soup.find_all(id=re.compile(r"modal|cookie")):
        tag.decompose()


def _find_sections(root: Tag) -> list[Tag]:
    """Findet Top-Level-Sections im HTML."""
    # 1. CMS-Article-Divs (mod_article) — höchste Priorität
    #    Viele CMS erzeugen <div class="mod_article"> als Sections
    articles = root.find_all(class_=re.compile(r"mod_article"))
    if len(articles) >= 2:
        return [a for a in articles if isinstance(a, Tag)]

    # 2. Semantische <section>-Tags (direkte Kinder)
    sections = root.find_all("section", recursive=False)
    if len(sections) >= 2:
        return [s for s in sections if isinstance(s, Tag)]

    # 3. Semantische <section>-Tags (rekursiv)
    sections = root.find_all("section")
    if len(sections) >= 2:
        return [s for s in sections if isinstance(s, Tag)]

    # 4. Klassen-basierte Sections (article, section CSS-Klasse)
    articles = root.find_all(class_=re.compile(r"section|article"))
    if len(articles) >= 2:
        return [a for a in articles if isinstance(a, Tag)]

    # 5. Einzelne section oder root selbst
    if sections:
        return [s for s in sections if isinstance(s, Tag)]
    if isinstance(root, Tag):
        return [root]
    return []


def _convert_element(el: Tag) -> Node | None:
    """Konvertiert ein HTML-Element in einen Node."""
    if not isinstance(el, Tag):
        return None

    # Leere Elemente ignorieren (ausser Media-Tags)
    media_tags = {"img", "video", "iframe", "input", "select", "textarea", "source"}
    text = el.get_text(strip=True)
    if not text and el.name not in media_tags and not el.find(list(media_tags)):
        return None

    node_type = _classify_tag(el)

    if node_type == NodeType.HEADING:
        return _make_heading(el)

    if node_type == NodeType.PARAGRAPH:
        return _make_paragraph(el)

    if node_type == NodeType.LIST:
        return _make_list(el)

    if node_type == NodeType.IMAGE:
        return _make_image(el)

    if node_type == NodeType.FIGURE:
        return _make_figure(el)

    if node_type == NodeType.VIDEO:
        return _make_video(el)

    if node_type == NodeType.IFRAME:
        return _make_iframe(el)

    if node_type == NodeType.DETAILS:
        return _make_details(el)

    if node_type == NodeType.TABLE:
        return _make_table(el)

    if node_type == NodeType.FORM:
        return _make_form(el)

    if node_type in (NodeType.LINK, NodeType.BUTTON):
        return _make_link_or_button(el, node_type)

    if node_type == NodeType.INPUT:
        return _make_input(el)

    # SECTION, GROUP, GRID: Kinder rekursiv verarbeiten
    children = _convert_children(el)
    if not children:
        # Leerer Container mit nur Text -> als Paragraph
        if text:
            return Node(type=NodeType.PARAGRAPH, props={"text": text, "html": str(el)})
        return None

    # Grid-Erkennung bei GROUP
    if node_type == NodeType.GROUP:
        node_type = _detect_grid(el, children)

    props: dict = {}
    if node_type == NodeType.GRID:
        props["columns"] = _estimate_grid_columns(el, children)

    # CSS-Klassen als optionaler Hint weitergeben
    css_classes = " ".join(el.get("class", []))
    if css_classes:
        props["css_classes"] = css_classes

    return Node(type=node_type, children=children, props=props)


def _classify_tag(el: Tag) -> NodeType:
    """Klassifiziert ein HTML-Element primär über den Tag-Namen."""
    tag = el.name.lower()

    tag_map: dict[str, NodeType] = {
        "section": NodeType.SECTION,
        "article": NodeType.SECTION,
        "main": NodeType.SECTION,
        "aside": NodeType.SECTION,
        "h1": NodeType.HEADING,
        "h2": NodeType.HEADING,
        "h3": NodeType.HEADING,
        "h4": NodeType.HEADING,
        "h5": NodeType.HEADING,
        "h6": NodeType.HEADING,
        "p": NodeType.PARAGRAPH,
        "blockquote": NodeType.PARAGRAPH,
        "ul": NodeType.LIST,
        "ol": NodeType.LIST,
        "img": NodeType.IMAGE,
        "figure": NodeType.FIGURE,
        "video": NodeType.VIDEO,
        "iframe": NodeType.IFRAME,
        "details": NodeType.DETAILS,
        "table": NodeType.TABLE,
        "form": NodeType.FORM,
        "input": NodeType.INPUT,
        "select": NodeType.INPUT,
        "textarea": NodeType.INPUT,
        "button": NodeType.BUTTON,
    }

    if tag in tag_map:
        return tag_map[tag]

    # <a> als LINK oder BUTTON
    if tag == "a":
        classes = " ".join(el.get("class", []))
        if re.search(r"btn|button|cta", classes, re.IGNORECASE):
            return NodeType.BUTTON
        return NodeType.LINK

    # <div> und <span>: Inhalt analysieren
    if tag in ("div", "span", "li"):
        return _classify_div(el)

    return NodeType.GROUP


def _classify_div(el: Tag) -> NodeType:
    """Klassifiziert ein <div>/<span> anhand Inhalt und optionaler CSS-Hints."""
    classes = " ".join(el.get("class", []))

    # CSS-Hints als sekundäres Signal
    if re.search(r"grid|autogrid|row|columns|dreispaltig", classes, re.IGNORECASE):
        return NodeType.GRID

    # Bild-Container mit Overlay-Text (ce_bgimage → section-artiger Block)
    if re.search(r"ce_bgimage", classes, re.IGNORECASE):
        return NodeType.SECTION

    # Bild-Container (ce_image)
    if re.search(r"ce_image|image-container", classes, re.IGNORECASE):
        if el.find("img"):
            return NodeType.FIGURE

    # Gallery-Container
    if re.search(r"ce_gallery|gallery", classes, re.IGNORECASE):
        if el.find("img"):
            return NodeType.GRID

    # Iconbox-Container (oft als Cards verwendet)
    if re.search(r"ce_iconbox", classes, re.IGNORECASE):
        return NodeType.GROUP  # Wird in nodes_to_blocks als Card erkannt

    # Slider/Swiper-Container
    if re.search(r"cc_reisen_slider|swiper-container|ce_swiper", classes, re.IGNORECASE):
        return NodeType.GROUP  # Slider-Erkennung in nodes_to_blocks

    # Enthält nur ein einzelnes semantisches Element?
    direct_tags = [c for c in el.children if isinstance(c, Tag)]
    if len(direct_tags) == 1:
        inner = direct_tags[0]
        if inner.name == "form":
            return NodeType.FORM
        if inner.name == "table":
            return NodeType.TABLE
        if inner.name == "details":
            return NodeType.DETAILS
        if inner.name in ("img",):
            return NodeType.IMAGE
        if inner.name == "figure":
            return NodeType.FIGURE
        if inner.name == "video":
            return NodeType.VIDEO
        if inner.name == "iframe":
            return NodeType.IFRAME

    # Swiper/Slider-Container
    if re.search(r"swiper|slider|carousel", classes, re.IGNORECASE):
        return NodeType.GROUP  # Slider-Erkennung in nodes_to_blocks

    return NodeType.GROUP


def _convert_children(el: Tag) -> list[Node]:
    """Konvertiert alle Kinder eines Elements rekursiv."""
    children: list[Node] = []
    for child in el.children:
        if isinstance(child, NavigableString):
            text = str(child).strip()
            if text:
                children.append(Node(type=NodeType.PARAGRAPH, props={"text": text}))
            continue
        if isinstance(child, Tag):
            if child.name in ("script", "style", "link", "noscript"):
                continue
            node = _convert_element(child)
            if node is not None:
                children.append(node)
    return children


def _detect_grid(el: Tag, children: list[Node]) -> NodeType:
    """Erkennt ob ein GROUP-Node eigentlich ein GRID ist."""
    classes = " ".join(el.get("class", []))

    # CSS-Hint
    if re.search(r"grid|autogrid|row|columns|flex", classes, re.IGNORECASE):
        return NodeType.GRID

    # Struktureller Hint: 2+ gleichartige Kinder
    if len(children) >= 2:
        types = [c.type for c in children]
        most_common = max(set(types), key=types.count)
        if types.count(most_common) >= 2 and most_common == NodeType.GROUP:
            return NodeType.GRID

    return NodeType.GROUP


def _estimate_grid_columns(el: Tag, children: list[Node]) -> int:
    """Schätzt die Spaltenanzahl eines Grids."""
    classes = " ".join(el.get("class", []))

    # CSS-Hint für Spaltenanzahl
    col_match = re.search(r"(?:grid-cols-|col-)(\d+)", classes)
    if col_match:
        return int(col_match.group(1))

    # Spezifische Grid-Klassen
    if "dreispaltig" in classes:
        return 3
    if re.search(r"grid_25_25_25_25|grid_20_20_20_20", classes):
        return 4
    if re.search(r"grid_50_50|grid_33_66|grid_66_33", classes):
        return 2

    # Fallback: Anzahl der direkten Kinder
    return min(len(children), 4)


# ─── Leaf-Node Factories ─────────────────────────────────────


def _make_heading(el: Tag) -> Node:
    level = int(el.name[1]) if el.name[0] == "h" else 2
    return Node(
        type=NodeType.HEADING,
        props={"level": level, "text": el.get_text(strip=True)},
    )


def _make_paragraph(el: Tag) -> Node:
    return Node(
        type=NodeType.PARAGRAPH,
        props={"text": el.get_text(strip=True), "html": str(el)},
    )


def _make_list(el: Tag) -> Node:
    items = []
    for li in el.find_all("li", recursive=False):
        items.append({"text": li.get_text(strip=True), "html": str(li)})
    return Node(
        type=NodeType.LIST,
        props={"ordered": el.name == "ol", "items": items},
    )


def _make_image(el: Tag) -> Node:
    return Node(
        type=NodeType.IMAGE,
        props={"src": el.get("src", ""), "alt": el.get("alt", "")},
    )


def _make_figure(el: Tag) -> Node:
    children: list[Node] = []
    img = el.find("img")
    if isinstance(img, Tag):
        children.append(_make_image(img))
    caption = el.find("figcaption")
    if caption:
        children.append(Node(
            type=NodeType.PARAGRAPH,
            props={"text": caption.get_text(strip=True)},
        ))
    return Node(type=NodeType.FIGURE, children=children)


def _make_video(el: Tag) -> Node:
    src = str(el.get("src", "") or "")
    if not src:
        source = el.find("source")
        if isinstance(source, Tag):
            src = str(source.get("src", "") or "")
    return Node(
        type=NodeType.VIDEO,
        props={"src": src, "poster": str(el.get("poster", "") or "")},
    )


def _make_iframe(el: Tag) -> Node:
    src = str(el.get("src", "") or "")
    iframe_type = "other"
    if re.search(r"youtube|youtu\.be|vimeo", src):
        iframe_type = "youtube"
    elif re.search(r"maps|openstreetmap", src):
        iframe_type = "map"
    return Node(
        type=NodeType.IFRAME,
        props={"src": src, "iframe_type": iframe_type},
    )


def _make_details(el: Tag) -> Node:
    children: list[Node] = []
    summary = el.find("summary")
    if summary:
        children.append(Node(
            type=NodeType.HEADING,
            props={"level": 3, "text": summary.get_text(strip=True)},
        ))
    for child in el.children:
        if isinstance(child, Tag) and child.name != "summary":
            node = _convert_element(child)
            if node is not None:
                children.append(node)
    if not children:
        text = el.get_text(strip=True)
        if text:
            children.append(Node(type=NodeType.PARAGRAPH, props={"text": text}))
    return Node(type=NodeType.DETAILS, children=children)


def _make_table(el: Tag) -> Node:
    table: Tag = el if el.name == "table" else el.find("table")  # type: ignore[assignment]
    if not isinstance(table, Tag):
        return Node(type=NodeType.TABLE)

    rows: list[Node] = []
    for tr in table.find_all("tr"):
        cells: list[Node] = []
        for td in tr.find_all(["td", "th"]):
            cells.append(Node(
                type=NodeType.TABLE_CELL,
                props={
                    "text": td.get_text(strip=True),
                    "is_header": td.name == "th",
                },
            ))
        if cells:
            rows.append(Node(type=NodeType.TABLE_ROW, children=cells))
    return Node(type=NodeType.TABLE, children=rows)


def _make_form(el: Tag) -> Node:
    form_el: Tag = el if el.name == "form" else el.find("form")  # type: ignore[assignment]
    if not isinstance(form_el, Tag):
        form_el = el

    children: list[Node] = []
    for inp in form_el.find_all(["input", "select", "textarea"]):
        children.append(_make_input(inp))
    for btn in form_el.find_all(["button", "input"], attrs={"type": "submit"}):
        children.append(Node(
            type=NodeType.BUTTON,
            props={"text": btn.get_text(strip=True) or btn.get("value", "")},
        ))

    has_email = any(
        c.props.get("input_type") == "email" for c in children
        if c.type == NodeType.INPUT
    )
    return Node(
        type=NodeType.FORM,
        children=children,
        props={"has_email": has_email, "field_count": len(children)},
    )


def _make_link_or_button(el: Tag, node_type: NodeType) -> Node:
    return Node(
        type=node_type,
        props={
            "href": el.get("href", ""),
            "text": el.get_text(strip=True),
        },
    )


def _make_input(el: Tag) -> Node:
    input_type = el.get("type", el.name)
    label = ""
    # Label suchen (zugehöriges <label>)
    parent = el.parent
    if parent:
        label_el = parent.find("label")
        if label_el:
            label = label_el.get_text(strip=True)
    return Node(
        type=NodeType.INPUT,
        props={
            "input_type": input_type,
            "name": el.get("name", ""),
            "label": label,
            "required": el.has_attr("required"),
        },
    )
