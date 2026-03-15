LAYOUT_PRESETS = {
    "full":               {"label": "Volle Breite",          "columns": 1, "grid": "1fr"},
    "two-col-equal":      {"label": "2 Spalten (50/50)",     "columns": 2, "grid": "1fr 1fr"},
    "two-col-left-wide":  {"label": "2 Spalten (2/3+1/3)",  "columns": 2, "grid": "2fr 1fr"},
    "two-col-right-wide": {"label": "2 Spalten (1/3+2/3)",  "columns": 2, "grid": "1fr 2fr"},
    "three-col-equal":    {"label": "3 Spalten (gleich)",    "columns": 3, "grid": "1fr 1fr 1fr"},
    "four-col-equal":     {"label": "4 Spalten (gleich)",    "columns": 4, "grid": "repeat(4, 1fr)"},
}


def get_presets_list() -> list[dict]:
    return [{"key": k, **v} for k, v in LAYOUT_PRESETS.items()]
