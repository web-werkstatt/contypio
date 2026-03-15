"""
Tests fuer den semantischen Node-Baum (html_to_nodes + nodes_to_blocks).
"""
import sys
from pathlib import Path

# Backend-App in Pfad einfuegen
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.importers.html_to_nodes import parse_html_to_tree
from app.importers.node_schema import Node, NodeType
from app.importers.nodes_to_blocks import convert_tree_to_sections


# ─── Phase 1: HTML → Node-Baum ───────────────────────────────


def test_heading_recognition():
    html = "<section><h2>Titel</h2><p>Text</p></section>"
    tree = parse_html_to_tree(html)
    assert tree.type == NodeType.PAGE
    assert len(tree.children) == 1
    section = tree.children[0]
    assert section.type == NodeType.SECTION
    headings = section.find_all(NodeType.HEADING)
    assert len(headings) == 1
    assert headings[0].props["text"] == "Titel"
    assert headings[0].props["level"] == 2


def test_paragraph_recognition():
    html = "<section><p>Ein Absatz</p></section>"
    tree = parse_html_to_tree(html)
    paras = tree.find_all(NodeType.PARAGRAPH)
    assert any(p.props.get("text") == "Ein Absatz" for p in paras)


def test_list_recognition():
    html = "<section><ul><li>Eins</li><li>Zwei</li></ul></section>"
    tree = parse_html_to_tree(html)
    lists = tree.find_all(NodeType.LIST)
    assert len(lists) == 1
    assert lists[0].props["ordered"] is False
    assert len(lists[0].props["items"]) == 2


def test_image_recognition():
    html = '<section><img src="/bild.jpg" alt="Test" /></section>'
    tree = parse_html_to_tree(html)
    images = tree.find_all(NodeType.IMAGE)
    assert len(images) == 1
    assert images[0].props["src"] == "/bild.jpg"
    assert images[0].props["alt"] == "Test"


def test_figure_recognition():
    html = '<section><figure><img src="/a.jpg" alt="A" /><figcaption>Bildunterschrift</figcaption></figure></section>'
    tree = parse_html_to_tree(html)
    figures = tree.find_all(NodeType.FIGURE)
    assert len(figures) == 1
    assert figures[0].children[0].type == NodeType.IMAGE


def test_iframe_youtube():
    html = '<section><iframe src="https://www.youtube.com/embed/abc123"></iframe></section>'
    tree = parse_html_to_tree(html)
    iframes = tree.find_all(NodeType.IFRAME)
    assert len(iframes) == 1
    assert iframes[0].props["iframe_type"] == "youtube"


def test_iframe_map():
    html = '<section><iframe src="https://maps.google.com/embed"></iframe></section>'
    tree = parse_html_to_tree(html)
    iframes = tree.find_all(NodeType.IFRAME)
    assert len(iframes) == 1
    assert iframes[0].props["iframe_type"] == "map"


def test_details_recognition():
    html = "<section><details><summary>Frage?</summary><p>Antwort.</p></details></section>"
    tree = parse_html_to_tree(html)
    details = tree.find_all(NodeType.DETAILS)
    assert len(details) == 1


def test_table_recognition():
    html = "<section><table><tr><th>Kopf</th></tr><tr><td>Wert</td></tr></table></section>"
    tree = parse_html_to_tree(html)
    tables = tree.find_all(NodeType.TABLE)
    assert len(tables) == 1
    assert len(tables[0].children) == 2  # 2 Reihen


def test_form_recognition():
    html = '<section><form><input type="email" name="email" /><input type="text" name="name" /><button type="submit">Absenden</button></form></section>'
    tree = parse_html_to_tree(html)
    forms = tree.find_all(NodeType.FORM)
    assert len(forms) == 1
    assert forms[0].props["has_email"] is True


def test_nav_footer_removed():
    html = "<nav>Nav</nav><section><p>Inhalt</p></section><footer>Footer</footer>"
    tree = parse_html_to_tree(html)
    assert not tree.find_all(NodeType.LINK)  # nav entfernt
    paras = tree.find_all(NodeType.PARAGRAPH)
    assert any(p.props.get("text") == "Inhalt" for p in paras)


def test_grid_detection():
    html = '<section><div class="grid grid-cols-3"><div><h3>A</h3><p>Text A</p></div><div><h3>B</h3><p>Text B</p></div><div><h3>C</h3><p>Text C</p></div></div></section>'
    tree = parse_html_to_tree(html)
    grids = tree.find_all(NodeType.GRID)
    assert len(grids) >= 1


# ─── Phase 2: Node-Baum → CMS Blocks ─────────────────────────


def test_faq_block():
    html = """<section>
        <details><summary>Frage 1?</summary><p>Antwort 1</p></details>
        <details><summary>Frage 2?</summary><p>Antwort 2</p></details>
    </section>"""
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "faq" in block_types


def test_gallery_block():
    html = '<section><div class="grid"><img src="/1.jpg" /><img src="/2.jpg" /><img src="/3.jpg" /></div></section>'
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "gallery" in block_types


def test_table_block():
    html = "<section><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></section>"
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "table" in block_types


def test_video_block():
    html = '<section><iframe src="https://www.youtube.com/embed/xyz"></iframe></section>'
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "video" in block_types


def test_map_block():
    html = '<section><iframe src="https://maps.google.com/embed?q=Berlin"></iframe></section>'
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "map" in block_types


def test_newsletter_block():
    html = '<section><form><input type="email" name="email" /><input type="text" name="name" /><button type="submit">Anmelden</button></form></section>'
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "newsletter" in block_types


def test_form_block():
    html = """<section><form>
        <input type="text" name="vorname" />
        <input type="text" name="nachname" />
        <input type="text" name="telefon" />
        <input type="text" name="betreff" />
        <textarea name="nachricht"></textarea>
        <button type="submit">Senden</button>
    </form></section>"""
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "form" in block_types


def test_richtext_block():
    html = "<section><h2>Titel</h2><p>Text eins.</p><p>Text zwei.</p></section>"
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "richText" in block_types


def test_image_block():
    html = '<section><figure><img src="/bild.jpg" alt="Landschaft" /><figcaption>Schoen</figcaption></figure></section>'
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "image" in block_types


def test_cards_block():
    html = """<section><div class="grid grid-cols-3">
        <div><h3>Karte 1</h3><p>Text 1</p></div>
        <div><h3>Karte 2</h3><p>Text 2</p></div>
        <div><h3>Karte 3</h3><p>Text 3</p></div>
    </div></section>"""
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "cards" in block_types


def test_output_format():
    """Prüft dass das Output-Format dem bestehenden Section/Column/Block-Schema entspricht."""
    html = "<section><h2>Titel</h2><p>Inhalt</p></section>"
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    assert len(sections) >= 1
    s = sections[0]
    assert "id" in s
    assert "layout" in s
    assert "columns" in s
    col = s["columns"][0]
    assert "id" in col
    assert "blocks" in col
    block = col["blocks"][0]
    assert "id" in block
    assert "blockType" in block
    assert "data" in block


def test_deeply_nested_divs_no_recursion_error():
    """Tief verschachtelte DIVs dürfen keinen RecursionError auslösen."""
    inner = "<p>Inhalt</p>"
    for _ in range(50):
        inner = f"<div>{inner}</div>"
    html = f"<section>{inner}</section>"
    tree = parse_html_to_tree(html)
    sections = convert_tree_to_sections(tree)
    # Muss ohne Fehler durchlaufen und mindestens einen Block produzieren
    block_types = _get_block_types(sections)
    assert len(block_types) >= 1


# ─── Helpers ──────────────────────────────────────────────────


def _get_block_types(sections: list[dict]) -> list[str]:
    types: list[str] = []
    for s in sections:
        for col in s.get("columns", []):
            for b in col.get("blocks", []):
                types.append(b.get("blockType", "unknown"))
    return types
