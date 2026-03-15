"""
HTML-Block-Erkennung fuer den Website-to-CMS Importer.
Erkennt gaengige HTML-Strukturen und ordnet sie CMS-Block-Typen zu.
Unterstuetzt: Standard-HTML, Swiper-Slider, Icon-/Link-Boxen, Teamboxen, Galerien etc.
"""
import re
import uuid

from bs4 import Tag


def _new_id() -> str:
    return str(uuid.uuid4())[:8]


# ─── Block-Typ Erkennung ───────────────────────────────────────


def detect_block_type(el: Tag) -> str:
    """Erkennt den Block-Typ anhand von CSS-Klassen und HTML-Struktur."""
    classes = " ".join(el.get("class", []))
    class_list = el.get("class", [])

    # CMS-Block-Klassen (bereits gerenderte CMS-Blöcke)
    for cls in class_list:
        if cls.startswith("cms-block-"):
            type_name = cls.replace("cms-block-", "")
            mapping = {
                "richtext": "richText", "image": "image", "gallery": "gallery",
                "cards": "cards", "cta": "cta", "faq": "faq", "newsletter": "newsletter",
                "hero": "hero", "video": "video", "embed": "embed", "map": "map",
                "form": "form", "spacer": "spacer", "tabs": "tabs", "table": "table",
                "testimonials": "testimonials", "team": "team", "logoslider": "logoSlider",
                "counter": "counter", "sociallinks": "socialLinks",
            }
            return mapping.get(type_name, "richText")

    # FAQ/Accordion (HTML5 <details>)
    if el.name == "details" or "cms-faq" in classes or el.find("details"):
        return "faq"

    # Hero Slider (Swiper, eigene Klassen)
    if "hero-slider" in classes or "slider-container" in classes:
        return "heroSlider"
    if "cc_reisen_slider" in classes:
        return "heroSlider"
    if el.find(class_="cc_reisen_slider"):
        return "heroSlider"
    swiper = el.find(class_=re.compile(r"swiper-container"))
    if swiper and swiper.find(class_="swiper-slide"):
        slide = swiper.find(class_="swiper-slide")
        if slide and (slide.find(class_="reisepreis") or slide.find(class_="price")
                      or slide.find(class_="slider-content-wrapper")):
            return "heroSlider"

    # Reiseangebote-Grid (CustomCatalog, Travel-Grid)
    if "travel-grid" in classes or "trip-grid" in classes:
        return "featuredTrips"
    if "top_objects" in classes and "mod_customcataloglist" in classes:
        return "featuredTrips"
    if el.find(class_="cc_reisen_inside") and el.find_all(class_="dreispaltig"):
        return "featuredTrips"
    if "mod_customcataloglist" in classes and "cc_reisen" in classes:
        if el.find(class_="entries") or el.find(class_="dreispaltig"):
            return "featuredTrips"

    # Reise-Listing
    if "travel-listing" in classes or "trip-listing" in classes:
        return "tripListing"

    # Trust-Leiste
    if "trust-strip" in classes or "trust-bar" in classes:
        return "trustStrip"

    # Kundenstimmen/Testimonials
    if "ce_testimonial" in classes or "testimonial_quote" in classes:
        return "testimonials"
    if "testimonial-carousel" in classes or "testimonial-slider" in classes:
        return "testimonials"
    if el.find(class_="ce_testimonial") or el.find(class_="testimonial-carousel"):
        return "testimonials"

    # Team (Teambox-Elemente, Team-Gallery)
    if "ce_teambox" in classes or "team-gallery-item" in classes:
        return "team"
    teamboxes = el.find_all(class_=re.compile(r"ce_teambox|team-gallery-item"))
    if len(teamboxes) >= 2:
        return "team"

    # Formular (form + formbody)
    form = el if el.name == "form" else el.find("form")
    if form:
        if form.find("input", attrs={"type": "email"}):
            all_inputs = form.find_all(["input", "select", "textarea"])
            if len(all_inputs) <= 4:
                return "newsletter"
            return "form"
        if form.find(class_="formbody"):
            return "form"
    if el.find(class_="formbody"):
        return "form"

    # Cards VOR Gallery pruefen (Cards enthalten oft Bilder, wuerden sonst als Gallery erkannt)
    cards = el.find_all(class_=re.compile(r"^card$|card-item"))
    if len(cards) >= 2:
        return "cards"
    iconboxes = el.find_all(class_=re.compile(r"ce_iconbox"))
    if len(iconboxes) >= 2:
        return "cards"
    linkboxes = el.find_all(class_=re.compile(r"ce_linkbox"))
    if len(linkboxes) >= 2:
        return "cards"

    # Galerie (ce_gallery, flex-gallery, oder >=3 Bilder ohne Card-Struktur)
    if "cms-gallery" in classes or "gallery" in classes:
        return "gallery"
    if "ce_gallery" in classes or "flex-gallery" in classes:
        return "gallery"
    if el.find(class_="ce_gallery"):
        return "gallery"
    imgs = el.find_all("img", recursive=True)
    if len(imgs) >= 3:
        return "gallery"

    # CTA (cta-Klasse, butt-weiterl)
    if "cta" in classes or "butt-weiterl" in classes:
        return "cta"

    # Einzelne Iconbox/Linkbox
    if "ce_iconbox" in classes or "ce_linkbox" in classes:
        return "cards"

    # Einzelbild
    if el.name == "figure" or (len(imgs) == 1 and el.find("figcaption")):
        return "image"
    if "ce_image" in classes or "ce_image_extended" in classes:
        return "image"

    # Video
    if el.find("video") or el.find("iframe", src=re.compile(r"youtube|vimeo")):
        return "video"

    # Tabelle
    if el.find("table"):
        return "table"

    # Karte (Google Maps, OpenStreetMap)
    if el.find("iframe", src=re.compile(r"maps|openstreetmap")):
        return "map"

    return "richText"


# ─── Daten-Extraktion ──────────────────────────────────────────


def extract_data(el: Tag, block_type: str) -> dict:
    """Extrahiert Block-Daten aus HTML je nach erkanntem Typ."""
    if block_type == "faq":
        items = []
        for detail in el.find_all("details"):
            summary = detail.find("summary")
            question = summary.get_text(strip=True) if summary else ""
            answer_parts = [
                str(c) for c in detail.children
                if getattr(c, "name", None) != "summary" and str(c).strip()
            ]
            items.append({"id": _new_id(), "question": question, "answer": "".join(answer_parts)})
        return {"title": "", "items": items}

    if block_type == "gallery":
        images = [{"src": img.get("src", ""), "alt": img.get("alt", "")} for img in el.find_all("img")]
        return {"title": "", "images": images, "layout": "grid"}

    if block_type == "cta":
        h = el.find(["h2", "h3"])
        p = el.find("p")
        btn = el.find(["a", "button"], class_=re.compile(r"btn|button|cta")) or el.find(["a", "button"])
        return {
            "title": h.get_text(strip=True) if h else "",
            "text": p.get_text(strip=True) if p else "",
            "buttonLabel": btn.get_text(strip=True) if btn else "",
            "buttonHref": btn.get("href", "") if btn else "",
            "variant": "primary",
        }

    if block_type == "cards":
        return _extract_cards(el)

    if block_type == "table":
        table = el.find("table")
        if table:
            headers = [th.get_text(strip=True) for th in table.find_all("th")]
            rows = [
                [td.get_text(strip=True) for td in tr.find_all("td")]
                for tr in table.find_all("tr") if tr.find("td")
            ]
            return {"title": "", "headers": headers, "rows": rows, "striped": True, "responsive": True, "caption": ""}
        return {"title": "", "headers": [], "rows": []}

    if block_type in ("heroSlider", "featuredTrips", "tripListing", "testimonials"):
        labels = {
            "heroSlider": "Hero-Slider (externe API)",
            "featuredTrips": "Reiseangebote (externe API)",
            "tripListing": "Reiseliste (externe API)",
            "testimonials": "Kundenstimmen (externe API)",
        }
        return {
            "source": "api",
            "hint": labels.get(block_type, "Externe API"),
            "maxItems": 9 if block_type == "featuredTrips" else 50,
        }

    if block_type == "team":
        members = []
        for tb in el.find_all(class_=re.compile(r"ce_teambox|team-gallery-item")):
            name_el = tb.find(class_=re.compile(r"name|team-gallery-name")) or tb.find("h5")
            phone_el = tb.find(class_="phone")
            email_el = tb.find(class_="email")
            img = tb.find("img")
            members.append({
                "id": _new_id(),
                "name": name_el.get_text(strip=True) if name_el else "",
                "phone": phone_el.get_text(strip=True) if phone_el else "",
                "email": email_el.get_text(strip=True) if email_el else "",
                "image": img.get("src", "") if img else "",
            })
        return {"title": "", "members": members}

    if block_type == "form":
        return _extract_form(el)

    if block_type == "trustStrip":
        items = [{"text": it.get_text(strip=True)} for it in el.find_all(class_=re.compile(r"trust-item|badge"))]
        return {"items": items}

    # Default: richText
    h = el.find(["h1", "h2", "h3"])
    return {"title": h.get_text(strip=True) if h else "", "content": str(el)}


def _extract_cards(el: Tag) -> dict:
    """Extrahiert Card-Daten (generisch, Iconbox, Linkbox)."""
    card_items = []
    for card in el.find_all(class_=re.compile(r"^card$|card-item")):
        h = card.find(["h3", "h4"])
        p = card.find("p")
        a = card.find("a")
        card_items.append({
            "id": _new_id(),
            "title": h.get_text(strip=True) if h else "",
            "text": p.get_text(strip=True) if p else "",
            "imageId": "",
            "href": a.get("href", "") if a else "",
        })
    for ibox in el.find_all(class_="ce_iconbox"):
        icon_el = ibox.find("i")
        content_el = ibox.find(class_="content") or ibox.find("p")
        card_items.append({
            "id": _new_id(),
            "title": "",
            "text": content_el.get_text(strip=True) if content_el else "",
            "imageId": "",
            "href": "",
            "icon": icon_el.get("class", [""])[0] if icon_el else "",
        })
    for lbox in el.find_all(class_="ce_linkbox"):
        h = lbox.find(["h2", "h3", "h4"])
        a = lbox.find("a")
        img = lbox.find("img")
        card_items.append({
            "id": _new_id(),
            "title": h.get_text(strip=True) if h else "",
            "text": "",
            "imageId": "",
            "href": a.get("href", "") if a else "",
            "image": img.get("src", "") if img else "",
        })
    return {"title": "", "items": card_items}


def _extract_form(el: Tag) -> dict:
    """Extrahiert Formulardaten."""
    form_el = el if el.name == "form" else el.find("form")
    fields = []
    if form_el:
        for widget in form_el.find_all(class_=re.compile(r"widget-text|widget-select|widget-textarea|widget-checkbox")):
            label_el = widget.find("label")
            inp = widget.find(["input", "select", "textarea"])
            fields.append({
                "label": label_el.get_text(strip=True) if label_el else "",
                "type": inp.get("type", inp.name) if inp else "text",
                "name": inp.get("name", "") if inp else "",
                "required": "mandatory" in " ".join(widget.get("class", [])),
            })
    h = el.find(["h2", "h3"])
    return {
        "title": h.get_text(strip=True) if h else "",
        "fields": fields,
        "hint": f"Formular mit {len(fields)} Feldern",
    }


# ─── Layout-Erkennung ──────────────────────────────────────────


def detect_layout(section: Tag) -> str:
    """Layout einer Section erkennen."""
    classes = " ".join(section.get("class", []))
    inner = " ".join(
        c for el in section.find_all(class_=re.compile(r"grid|columns|autogrid"))
        for c in (el.get("class") or [])
    )
    combined = f"{classes} {inner}"

    if "grid-cols-4" in combined:
        return "four-col-equal"
    if "grid-cols-3" in combined:
        return "three-col-equal"
    if "grid-cols-2" in combined:
        return "two-col-equal"

    # Autogrid Layouts (grid_50_50, dreispaltig, etc.)
    if "grid_25_25_25_25" in combined or "grid_20_20_20_20_20" in combined:
        return "four-col-equal"
    if "dreispaltig" in combined:
        return "three-col-equal"
    if "grid_50_50" in combined or "grid_33_66" in combined or "grid_66_33" in combined:
        return "two-col-equal"

    return "full"


# ─── Section-Level API-Typ ──────────────────────────────────────


def detect_section_api_type(stag: Tag) -> str | None:
    """Erkennt Sections die komplett von einer externen API befuellt werden."""
    css_class = " ".join(stag.get("class", []))
    inner_classes = " ".join(
        c for child in stag.find_all(class_=True, recursive=True)
        for c in (child.get("class") or [])
    )
    combined = f"{css_class} {inner_classes}"

    patterns = {
        "heroSlider": [
            "hero-slider", "slider-container", "hero-carousel",
            "cc_reisen_slider",
        ],
        "featuredTrips": [
            "travel-grid", "trip-grid", "featured-trips",
            "top_objects",
        ],
        "tripListing": ["travel-listing", "trip-listing"],
        "testimonials": [
            "testimonial-carousel", "testimonial-slider",
            "testimonials-section", "reviews-section",
            "ce_testimonial",
        ],
    }
    for block_type, keywords in patterns.items():
        for kw in keywords:
            if kw in combined:
                return block_type
    return None


# ─── Element-Block-Parsing ──────────────────────────────────────


def parse_element_blocks(el: Tag) -> list[dict]:
    """Parst ein Element in eine Liste von Blöcken."""
    blocks = []
    children = [c for c in el.children if isinstance(c, Tag) and c.name not in ("script", "style", "link")]

    if not children:
        text = el.get_text(strip=True)
        if text:
            bt = detect_block_type(el)
            blocks.append({"id": _new_id(), "blockType": bt, "data": extract_data(el, bt)})
        return blocks

    i = 0
    while i < len(children):
        child = children[i]
        bt = detect_block_type(child)

        if bt == "richText" and child.name in ("h1", "h2", "h3", "h4", "p", "ul", "ol"):
            group = [child]
            j = i + 1
            while j < len(children) and children[j].name in ("p", "ul", "ol", "blockquote"):
                group.append(children[j])
                j += 1
            content = "".join(str(g) for g in group)
            heading = group[0] if group[0].name in ("h1", "h2", "h3", "h4") else None
            blocks.append({
                "id": _new_id(),
                "blockType": "richText",
                "data": {"title": heading.get_text(strip=True) if heading else "", "content": content},
            })
            i = j
            continue

        blocks.append({"id": _new_id(), "blockType": bt, "data": extract_data(child, bt)})
        i += 1

    return blocks
