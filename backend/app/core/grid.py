"""CSS Grid Layout Engine for Contypio CMS.

Generates CSS from structured grid definitions. Supports:
- Preset layouts (backward-compatible with existing 6 presets)
- Custom layouts with arbitrary columns/rows/gap
- Responsive breakpoints (sm/md/lg)
- grid-template-areas for visual Grid Wizard
- Scoped CSS output per section

Usage:
    layout = resolve_grid("two-col-equal")
    css = layout.to_css("section-abc123")

    # Or custom:
    layout = GridLayout(
        key="custom",
        tracks={"lg": GridTrackConfig(columns=["2fr", "1fr"], gap="2rem"),
                "sm": GridTrackConfig(columns=["1fr"])},
    )
    css = layout.to_css("section-xyz")
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Allowed CSS values (security: prevent CSS injection)
# ---------------------------------------------------------------------------

_ALLOWED_UNITS = re.compile(
    r"^("
    r"\d+(\.\d+)?(fr|px|rem|em|%|vw|vh)"  # 1fr, 300px, 2.5rem
    r"|auto"
    r"|min-content|max-content|fit-content"
    r"|minmax\(\s*[\w.]+(%|px|rem|em|fr)?\s*,\s*[\w.]+(%|px|rem|em|fr)?\s*\)"
    r"|repeat\(\s*(\d+|auto-fill|auto-fit)\s*,\s*[^)]+\)"
    r")$"
)

_ALLOWED_GAP = re.compile(
    r"^\d+(\.\d+)?(px|rem|em|%|vw)$"
)

_ALLOWED_AREA_NAME = re.compile(r"^[a-zA-Z_][\w-]*$")


def _validate_track(value: str) -> str:
    """Validate a single track value against allowlist."""
    value = value.strip()
    if not _ALLOWED_UNITS.match(value):
        raise ValueError(f"Ungueltiger Grid-Track-Wert: '{value}'")
    return value


def _validate_gap(value: str) -> str:
    """Validate gap value."""
    value = value.strip()
    if not _ALLOWED_GAP.match(value):
        raise ValueError(f"Ungueltiger Gap-Wert: '{value}'")
    return value


def _validate_area_name(name: str) -> str:
    """Validate grid-area name."""
    name = name.strip()
    if name != "." and not _ALLOWED_AREA_NAME.match(name):
        raise ValueError(f"Ungueltiger Area-Name: '{name}'")
    return name


# ---------------------------------------------------------------------------
# Breakpoints
# ---------------------------------------------------------------------------

BREAKPOINTS = {
    "sm": "(max-width: 767px)",
    "md": "(min-width: 768px) and (max-width: 1023px)",
    "lg": None,  # Default, no media query
}

BREAKPOINT_ORDER = ["lg", "md", "sm"]

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


@dataclass
class GridAreaItem:
    """A named item placed on the grid via row/col coordinates."""

    name: str
    col_start: int
    col_end: int
    row_start: int
    row_end: int

    def __post_init__(self):
        self.name = _validate_area_name(self.name)
        if self.col_end <= self.col_start:
            raise ValueError(f"col_end ({self.col_end}) muss groesser als col_start ({self.col_start}) sein")
        if self.row_end <= self.row_start:
            raise ValueError(f"row_end ({self.row_end}) muss groesser als row_start ({self.row_start}) sein")

    def to_css(self, parent_selector: str) -> str:
        return (
            f"{parent_selector} > .{self.name} {{ "
            f"grid-area: {self.row_start} / {self.col_start} / {self.row_end} / {self.col_end}; "
            f"}}"
        )


@dataclass
class GridTrackConfig:
    """Grid track configuration for one breakpoint."""

    columns: list[str]
    rows: list[str] | None = None
    gap: str = "1.5rem"
    areas: list[list[str]] | None = None  # 2D matrix for grid-template-areas

    def __post_init__(self):
        self.columns = [_validate_track(c) for c in self.columns]
        if self.rows:
            self.rows = [_validate_track(r) for r in self.rows]
        self.gap = _validate_gap(self.gap)
        if self.areas:
            for row in self.areas:
                for cell in row:
                    _validate_area_name(cell)

    @property
    def column_count(self) -> int:
        return len(self.columns)


@dataclass
class GridLayout:
    """Complete grid layout with responsive breakpoints.

    Attributes:
        key: Layout identifier (preset name or "custom")
        label: Human-readable label
        tracks: Breakpoint -> GridTrackConfig mapping (at least "lg" required)
        items: Named grid items with placement per breakpoint
        is_preset: True for built-in presets, False for user-created
    """

    key: str
    label: str = ""
    tracks: dict[str, GridTrackConfig] = field(default_factory=dict)
    items: dict[str, dict[str, GridAreaItem]] = field(default_factory=dict)
    is_preset: bool = True

    def __post_init__(self):
        if "lg" not in self.tracks:
            raise ValueError("GridLayout braucht mindestens 'lg' Breakpoint")

    @property
    def column_count(self) -> int:
        """Column count from the lg (default) breakpoint."""
        return self.tracks["lg"].column_count

    # ----- CSS Generation -----

    def _render_tracks(self, bp: str, selector: str) -> str:
        """Render CSS for grid container at one breakpoint."""
        track = self.tracks.get(bp)
        if not track:
            return ""

        cols = " ".join(track.columns)
        lines = [
            f"{selector} {{",
            f"  display: grid;",
            f"  grid-template-columns: {cols};",
        ]

        if track.rows:
            rows = " ".join(track.rows)
            lines.append(f"  grid-template-rows: {rows};")

        lines.append(f"  gap: {track.gap};")

        if track.areas:
            area_strings = ['"' + " ".join(row) + '"' for row in track.areas]
            lines.append(f"  grid-template-areas: {' '.join(area_strings)};")

        lines.append("}")
        return "\n".join(lines)

    def _render_items(self, bp: str, selector: str) -> str:
        """Render CSS for grid items at one breakpoint."""
        parts = []
        for per_bp in self.items.values():
            item = per_bp.get(bp)
            if item:
                parts.append(item.to_css(selector))
        return "\n".join(parts)

    def to_css(self, section_id: str) -> str:
        """Generate complete scoped CSS for this layout.

        Args:
            section_id: Used as CSS selector scope (.section-{id})

        Returns:
            Complete CSS string with media queries
        """
        selector = f".section-{section_id}"
        parts: list[str] = []

        # lg = default (no media query)
        lg_css = self._render_tracks("lg", selector)
        lg_items = self._render_items("lg", selector)
        if lg_css:
            parts.append(lg_css)
        if lg_items:
            parts.append(lg_items)

        # md breakpoint
        if "md" in self.tracks:
            md_css = self._render_tracks("md", selector)
            md_items = self._render_items("md", selector)
            if md_css or md_items:
                inner = "\n".join(filter(None, [md_css, md_items]))
                parts.append(f"@media {BREAKPOINTS['md']} {{\n{inner}\n}}")

        # sm breakpoint
        if "sm" in self.tracks:
            sm_css = self._render_tracks("sm", selector)
            sm_items = self._render_items("sm", selector)
            if sm_css or sm_items:
                inner = "\n".join(filter(None, [sm_css, sm_items]))
                parts.append(f"@media {BREAKPOINTS['sm']} {{\n{inner}\n}}")

        return "\n\n".join(parts)

    # ----- Config Output (for Delivery API) -----

    def to_config(self) -> dict:
        """Export as JSON-serializable dict for the Delivery API."""
        result: dict = {
            "key": self.key,
            "label": self.label,
            "is_preset": self.is_preset,
            "tracks": {},
        }
        for bp, track in self.tracks.items():
            t: dict = {"columns": track.columns, "gap": track.gap}
            if track.rows:
                t["rows"] = track.rows
            if track.areas:
                t["areas"] = track.areas
            result["tracks"][bp] = t

        if self.items:
            result["items"] = {}
            for name, per_bp in self.items.items():
                result["items"][name] = {}
                for bp, item in per_bp.items():
                    result["items"][name][bp] = {
                        "col_start": item.col_start,
                        "col_end": item.col_end,
                        "row_start": item.row_start,
                        "row_end": item.row_end,
                    }

        return result


# ---------------------------------------------------------------------------
# Preset Registry
# ---------------------------------------------------------------------------

PRESET_LAYOUTS: dict[str, GridLayout] = {
    "full": GridLayout(
        key="full",
        label="Volle Breite",
        tracks={
            "lg": GridTrackConfig(columns=["1fr"]),
        },
    ),
    "two-col-equal": GridLayout(
        key="two-col-equal",
        label="50 / 50",
        tracks={
            "lg": GridTrackConfig(columns=["1fr", "1fr"]),
            "sm": GridTrackConfig(columns=["1fr"]),
        },
    ),
    "two-col-left-wide": GridLayout(
        key="two-col-left-wide",
        label="2/3 + 1/3",
        tracks={
            "lg": GridTrackConfig(columns=["2fr", "1fr"]),
            "sm": GridTrackConfig(columns=["1fr"]),
        },
    ),
    "two-col-right-wide": GridLayout(
        key="two-col-right-wide",
        label="1/3 + 2/3",
        tracks={
            "lg": GridTrackConfig(columns=["1fr", "2fr"]),
            "sm": GridTrackConfig(columns=["1fr"]),
        },
    ),
    "three-col-equal": GridLayout(
        key="three-col-equal",
        label="3 Spalten",
        tracks={
            "lg": GridTrackConfig(columns=["1fr", "1fr", "1fr"]),
            "md": GridTrackConfig(columns=["1fr", "1fr"]),
            "sm": GridTrackConfig(columns=["1fr"]),
        },
    ),
    "four-col-equal": GridLayout(
        key="four-col-equal",
        label="4 Spalten",
        tracks={
            "lg": GridTrackConfig(columns=["1fr", "1fr", "1fr", "1fr"]),
            "md": GridTrackConfig(columns=["1fr", "1fr"]),
            "sm": GridTrackConfig(columns=["1fr"]),
        },
    ),
}


def resolve_grid(layout_key: str, grid_config: dict | None = None) -> GridLayout:
    """Resolve a layout key + optional config to a GridLayout.

    For preset keys ("full", "two-col-equal", etc.) returns the preset.
    For "custom", parses grid_config into a GridLayout.

    Args:
        layout_key: Preset key or "custom"
        grid_config: Required when layout_key == "custom"

    Returns:
        GridLayout instance
    """
    if layout_key != "custom":
        preset = PRESET_LAYOUTS.get(layout_key)
        if preset:
            return preset
        raise ValueError(f"Unbekannter Layout-Key: '{layout_key}'")

    if not grid_config:
        raise ValueError("layout 'custom' braucht grid_config")

    return _parse_grid_config(grid_config)


def _parse_grid_config(config: dict) -> GridLayout:
    """Parse a grid_config dict (from JSON) into a GridLayout."""
    tracks_raw = config.get("tracks", {})
    if not tracks_raw:
        raise ValueError("grid_config.tracks darf nicht leer sein")

    tracks: dict[str, GridTrackConfig] = {}
    for bp, t in tracks_raw.items():
        if bp not in BREAKPOINTS:
            raise ValueError(f"Ungueltiger Breakpoint: '{bp}' (erlaubt: sm, md, lg)")
        tracks[bp] = GridTrackConfig(
            columns=t.get("columns", ["1fr"]),
            rows=t.get("rows"),
            gap=t.get("gap", "1.5rem"),
            areas=t.get("areas"),
        )

    items: dict[str, dict[str, GridAreaItem]] = {}
    for name, per_bp in config.get("items", {}).items():
        items[name] = {}
        for bp, placement in per_bp.items():
            items[name][bp] = GridAreaItem(
                name=name,
                col_start=placement["col_start"],
                col_end=placement["col_end"],
                row_start=placement["row_start"],
                row_end=placement["row_end"],
            )

    return GridLayout(
        key="custom",
        label=config.get("label", "Benutzerdefiniert"),
        tracks=tracks,
        items=items,
        is_preset=False,
    )
