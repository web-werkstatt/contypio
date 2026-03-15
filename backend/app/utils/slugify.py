import re

_UMLAUT_MAP = {
    "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
    "Ä": "Ae", "Ö": "Oe", "Ü": "Ue",
}


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug with German umlaut support."""
    result = text
    for char, replacement in _UMLAUT_MAP.items():
        result = result.replace(char, replacement)
    result = result.lower()
    result = re.sub(r"[^a-z0-9]+", "-", result)
    result = result.strip("-")
    return result
