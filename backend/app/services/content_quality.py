"""Content Quality Service: Algorithmische Textbewertung für deutsche Webtexte.

Nutzt textstat mit deutschen Koeffizienten. Kein API-Key nötig.
"""

import textstat

textstat.set_lang("de")

BUZZWORDS: list[str] = [
    "revolutionär", "einzigartig", "state of the art", "gamechanger",
    "maßgeschneidert", "innovativ", "next level", "ganzheitlich",
    "synergien", "paradigmenwechsel", "disruptiv", "cutting edge",
    "best in class", "weltklasse", "premium", "exklusiv", "herausragend",
    "unvergleichlich", "bahnbrechend", "visionär", "transformativ",
    "holistisch", "agil", "skalierbar", "nahtlos", "360-grad",
    "end-to-end", "out of the box", "game changing", "wegweisend",
    "zukunftsweisend", "marktführend", "branchenführend", "erstklassig",
    "hochmodern", "topaktuell", "überragend", "sensationell", "fantastisch",
    "unschlagbar", "perfekt", "optimal", "maximal", "ultimativ",
    "rundum-sorglos", "alles-aus-einer-hand", "one-stop-shop", "turnkey",
]

CHANNEL_LIMITS: dict[str, dict] = {
    "linkedin": {"unit": "chars", "optimal": (900, 1300), "warn": (700, 1600)},
    "blog": {"unit": "words", "optimal": (800, 1500), "warn": (500, 2500)},
    "newsletter": {"unit": "words", "optimal": (150, 250), "warn": (100, 400)},
    "social": {"unit": "chars", "optimal": (0, 280), "warn": (0, 280)},
}


def _score_readability(flesch: float) -> int:
    if flesch >= 60:
        return 5
    if flesch >= 50:
        return 4
    if flesch >= 40:
        return 3
    if flesch >= 30:
        return 2
    return 1


def _score_sentence_len(avg: float) -> int:
    if avg <= 18:
        return 5
    if avg <= 22:
        return 4
    if avg <= 25:
        return 3
    return 1


def _score_paragraph_len(avg: float) -> int:
    if avg <= 80:
        return 5
    if avg <= 130:
        return 4
    if avg <= 150:
        return 3
    return 1


def _score_buzzwords(count: int) -> int:
    if count <= 1:
        return 5
    if count <= 2:
        return 4
    if count <= 4:
        return 3
    if count <= 6:
        return 2
    return 1


def _score_channel_fit(text: str, channel: str | None) -> int:
    if not channel or channel not in CHANNEL_LIMITS:
        return 5
    spec = CHANNEL_LIMITS[channel]
    value = len(text) if spec["unit"] == "chars" else len(text.split())
    lo, hi = spec["optimal"]
    wlo, whi = spec["warn"]
    if lo <= value <= hi:
        return 5
    if wlo <= value <= whi:
        return 3
    return 1


def evaluate_text(text: str, channel: str | None = None) -> dict:
    """Bewerte einen Text und liefere Metriken + Scores."""
    text = text.strip()
    if not text:
        return {"error": "Kein Text angegeben"}

    # Metriken
    flesch = textstat.flesch_reading_ease(text)
    wiener = textstat.wiener_sachtextformel(text, 1)
    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    avg_sentence = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    paragraphs = [p for p in text.split("\n") if p.strip()]
    avg_paragraph = sum(len(p.split()) for p in paragraphs) / max(len(paragraphs), 1)
    reading_time = textstat.reading_time(text, ms_per_char=14.69)
    text_lower = text.lower()
    buzz_count = sum(1 for bw in BUZZWORDS if bw in text_lower)
    buzz_found = [bw for bw in BUZZWORDS if bw in text_lower]

    # Scores
    s_read = _score_readability(flesch)
    s_sent = _score_sentence_len(avg_sentence)
    s_para = _score_paragraph_len(avg_paragraph)
    s_buzz = _score_buzzwords(buzz_count)
    s_chan = _score_channel_fit(text, channel)

    overall = round(
        0.30 * s_read + 0.25 * s_sent + 0.15 * s_para + 0.15 * s_buzz + 0.15 * s_chan,
        2,
    )

    return {
        "metrics": {
            "flesch_reading_ease": round(flesch, 1),
            "wiener_sachtextformel": round(wiener, 1),
            "avg_sentence_length": round(avg_sentence, 1),
            "avg_paragraph_length": round(avg_paragraph, 1),
            "reading_time_seconds": round(reading_time, 1),
            "word_count": len(text.split()),
            "char_count": len(text),
            "sentence_count": len(sentences),
            "buzzword_count": buzz_count,
            "buzzwords_found": buzz_found,
        },
        "scores": {
            "readability": s_read,
            "sentences": s_sent,
            "paragraphs": s_para,
            "buzzwords": s_buzz,
            "channel_fit": s_chan,
            "overall": overall,
        },
        "channel": channel,
        "recommendation": "publish" if overall >= 4.0 else "revise" if overall >= 3.0 else "rewrite",
    }
