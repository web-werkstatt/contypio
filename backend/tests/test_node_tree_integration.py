"""
Integrationstests: Realistische HTML-Seiten → Node-Baum → CMS-Blocks.
Prüft dass richText-Anteil unter 40% bleibt.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.importers.html_to_nodes import parse_html_to_tree
from app.importers.nodes_to_blocks import convert_tree_to_sections


REALISTIC_PAGE = """<!DOCTYPE html>
<html>
<body>
<nav><a href="/">Home</a><a href="/reisen">Reisen</a></nav>
<header><div class="logo">IR-Tours</div></header>

<section class="hero">
    <h1>Traumreisen weltweit</h1>
    <p>Entdecken Sie unsere handverlesenen Reiseziele.</p>
    <a href="/reisen" class="btn btn-primary">Alle Reisen entdecken</a>
</section>

<section class="about">
    <h2>Über uns</h2>
    <p>IR-Tours ist Ihr Spezialist für individuelle Reisen seit 1985.</p>
    <p>Mit über 30 Jahren Erfahrung bieten wir maßgeschneiderte Reiseerlebnisse.</p>
    <ul>
        <li>Persönliche Beratung</li>
        <li>Handverlesene Hotels</li>
        <li>24/7 Betreuung vor Ort</li>
    </ul>
</section>

<section class="services">
    <h2>Unsere Leistungen</h2>
    <div class="grid grid-cols-3">
        <div>
            <h3>Flugreisen</h3>
            <p>Komfortable Flüge zu den schönsten Zielen.</p>
            <img src="/img/flugreisen.jpg" alt="Flugreisen" />
        </div>
        <div>
            <h3>Kreuzfahrten</h3>
            <p>Luxuriöse Kreuzfahrten auf allen Meeren.</p>
            <img src="/img/kreuzfahrten.jpg" alt="Kreuzfahrten" />
        </div>
        <div>
            <h3>Wanderreisen</h3>
            <p>Aktiv die Natur erleben.</p>
            <img src="/img/wandern.jpg" alt="Wanderreisen" />
        </div>
    </div>
</section>

<section class="gallery">
    <h2>Impressionen</h2>
    <div class="grid">
        <img src="/img/1.jpg" alt="Strand" />
        <img src="/img/2.jpg" alt="Berge" />
        <img src="/img/3.jpg" alt="Stadt" />
        <img src="/img/4.jpg" alt="Natur" />
    </div>
</section>

<section class="faq">
    <h2>Häufige Fragen</h2>
    <details>
        <summary>Wie buche ich eine Reise?</summary>
        <p>Sie können telefonisch, per E-Mail oder direkt online buchen.</p>
    </details>
    <details>
        <summary>Was ist im Preis enthalten?</summary>
        <p>Flug, Hotel und Transfer sind im Grundpreis enthalten.</p>
    </details>
    <details>
        <summary>Kann ich stornieren?</summary>
        <p>Ja, bis 30 Tage vor Abreise kostenlos.</p>
    </details>
</section>

<section class="video">
    <h2>Unser Imagefilm</h2>
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>
</section>

<section class="contact">
    <h2>Kontakt</h2>
    <p>Haben Sie Fragen? Schreiben Sie uns!</p>
    <form>
        <input type="text" name="name" placeholder="Ihr Name" />
        <input type="email" name="email" placeholder="Ihre E-Mail" />
        <textarea name="message" placeholder="Ihre Nachricht"></textarea>
        <button type="submit">Absenden</button>
    </form>
</section>

<section class="map">
    <h2>So finden Sie uns</h2>
    <iframe src="https://maps.google.com/maps?q=Berlin&output=embed" width="600" height="450"></iframe>
</section>

<section class="table-section">
    <h2>Preisübersicht</h2>
    <table>
        <tr><th>Reise</th><th>Preis</th><th>Dauer</th></tr>
        <tr><td>Kreta</td><td>899 €</td><td>7 Tage</td></tr>
        <tr><td>Mallorca</td><td>699 €</td><td>5 Tage</td></tr>
        <tr><td>Thailand</td><td>1.299 €</td><td>14 Tage</td></tr>
    </table>
</section>

<section class="newsletter">
    <h2>Newsletter</h2>
    <p>Melden Sie sich für unsere Reise-Tipps an!</p>
    <form>
        <input type="email" name="email" placeholder="Ihre E-Mail" />
        <button type="submit">Anmelden</button>
    </form>
</section>

<section class="single-image">
    <figure>
        <img src="/img/team.jpg" alt="Unser Team" />
        <figcaption>Das IR-Tours Team in unserem Büro</figcaption>
    </figure>
</section>

<footer>
    <p>© 2024 IR-Tours</p>
</footer>
</body>
</html>"""


def _get_block_types(sections: list[dict]) -> list[str]:
    types: list[str] = []
    for s in sections:
        for col in s.get("columns", []):
            for b in col.get("blocks", []):
                types.append(b.get("blockType", "unknown"))
    return types


def _count_block_types(sections: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for bt in _get_block_types(sections):
        counts[bt] = counts.get(bt, 0) + 1
    return counts


def test_realistic_page_block_types():
    """Prüft dass eine realistische Seite diverse Block-Typen erkennt."""
    tree = parse_html_to_tree(REALISTIC_PAGE)
    sections = convert_tree_to_sections(tree)
    block_types = set(_get_block_types(sections))

    # Diese Typen MÜSSEN erkannt werden
    expected = {"faq", "gallery", "table", "video", "map", "newsletter", "image", "cards"}
    missing = expected - block_types
    assert not missing, f"Fehlende Block-Typen: {missing}. Erkannt: {block_types}"


def test_richtext_ratio_under_40_percent():
    """Prüft dass richText-Anteil unter 40% liegt."""
    tree = parse_html_to_tree(REALISTIC_PAGE)
    sections = convert_tree_to_sections(tree)
    counts = _count_block_types(sections)

    total = sum(counts.values())
    richtext_count = counts.get("richText", 0)

    assert total > 0, "Keine Blöcke erkannt"
    ratio = richtext_count / total
    print(f"\nBlock-Verteilung: {counts}")
    print(f"richText-Ratio: {richtext_count}/{total} = {ratio:.1%}")
    assert ratio < 0.40, f"richText-Anteil zu hoch: {ratio:.1%} (Ziel: <40%)"


def test_cta_detection():
    """Prüft CTA-Erkennung (HEADING + PARAGRAPH + BUTTON)."""
    tree = parse_html_to_tree(REALISTIC_PAGE)
    sections = convert_tree_to_sections(tree)
    block_types = _get_block_types(sections)
    assert "cta" in block_types, f"CTA nicht erkannt. Typen: {block_types}"


def test_no_empty_sections():
    """Prüft dass keine leeren Sections produziert werden."""
    tree = parse_html_to_tree(REALISTIC_PAGE)
    sections = convert_tree_to_sections(tree)
    for s in sections:
        blocks = []
        for col in s.get("columns", []):
            blocks.extend(col.get("blocks", []))
        assert len(blocks) > 0, f"Leere Section: {s['id']}"


def test_section_count():
    """Prüft dass die richtige Anzahl Sections erkannt wird."""
    tree = parse_html_to_tree(REALISTIC_PAGE)
    sections = convert_tree_to_sections(tree)
    # 11 section-Tags im HTML (nav/footer/header werden entfernt)
    assert len(sections) >= 8, f"Zu wenige Sections: {len(sections)}"
