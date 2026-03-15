"""Tests for the CSS Grid Layout Engine."""

import pytest

from app.core.grid import (
    PRESET_LAYOUTS,
    GridAreaItem,
    GridLayout,
    GridTrackConfig,
    resolve_grid,
)


class TestGridTrackConfig:
    def test_basic_columns(self):
        t = GridTrackConfig(columns=["1fr", "2fr"])
        assert t.column_count == 2
        assert t.gap == "1.5rem"

    def test_with_minmax(self):
        t = GridTrackConfig(columns=["minmax(300px, 1fr)", "2fr"])
        assert t.column_count == 2

    def test_with_repeat(self):
        t = GridTrackConfig(columns=["repeat(3, 1fr)"])
        assert t.column_count == 1  # repeat counts as 1 track definition

    def test_invalid_column_rejected(self):
        with pytest.raises(ValueError, match="Ungueltiger Grid-Track-Wert"):
            GridTrackConfig(columns=["1fr; background: red"])

    def test_invalid_gap_rejected(self):
        with pytest.raises(ValueError, match="Ungueltiger Gap-Wert"):
            GridTrackConfig(columns=["1fr"], gap="1rem; color: red")

    def test_auto_value(self):
        t = GridTrackConfig(columns=["auto", "1fr"])
        assert t.columns == ["auto", "1fr"]

    def test_rows(self):
        t = GridTrackConfig(columns=["1fr"], rows=["auto", "1fr", "auto"])
        assert t.rows == ["auto", "1fr", "auto"]


class TestGridAreaItem:
    def test_basic(self):
        item = GridAreaItem("header", col_start=1, col_end=4, row_start=1, row_end=2)
        css = item.to_css(".grid")
        assert "grid-area: 1 / 1 / 2 / 4" in css
        assert ".grid > .header" in css

    def test_invalid_name_rejected(self):
        with pytest.raises(ValueError, match="Ungueltiger Area-Name"):
            GridAreaItem("header; hack", col_start=1, col_end=2, row_start=1, row_end=2)

    def test_invalid_range_rejected(self):
        with pytest.raises(ValueError, match="col_end"):
            GridAreaItem("header", col_start=3, col_end=2, row_start=1, row_end=2)

    def test_dot_name_allowed(self):
        # "." is valid in grid-template-areas (empty cell)
        item = GridAreaItem(".", col_start=1, col_end=2, row_start=1, row_end=2)
        assert item.name == "."


class TestGridLayout:
    def test_requires_lg_breakpoint(self):
        with pytest.raises(ValueError, match="lg"):
            GridLayout(key="test", tracks={"sm": GridTrackConfig(columns=["1fr"])})

    def test_column_count(self):
        layout = GridLayout(
            key="test",
            tracks={"lg": GridTrackConfig(columns=["1fr", "2fr", "1fr"])},
        )
        assert layout.column_count == 3

    def test_to_css_basic(self):
        layout = GridLayout(
            key="full",
            tracks={"lg": GridTrackConfig(columns=["1fr"])},
        )
        css = layout.to_css("abc123")
        assert ".section-abc123" in css
        assert "display: grid" in css
        assert "grid-template-columns: 1fr" in css
        assert "gap: 1.5rem" in css
        assert "@media" not in css  # No media queries for lg-only

    def test_to_css_responsive(self):
        layout = GridLayout(
            key="two-col",
            tracks={
                "lg": GridTrackConfig(columns=["1fr", "1fr"]),
                "sm": GridTrackConfig(columns=["1fr"]),
            },
        )
        css = layout.to_css("resp1")
        assert "grid-template-columns: 1fr 1fr" in css
        assert "@media (max-width: 767px)" in css
        assert "grid-template-columns: 1fr;" in css  # sm single column

    def test_to_css_three_breakpoints(self):
        layout = GridLayout(
            key="three-col",
            tracks={
                "lg": GridTrackConfig(columns=["1fr", "1fr", "1fr"]),
                "md": GridTrackConfig(columns=["1fr", "1fr"]),
                "sm": GridTrackConfig(columns=["1fr"]),
            },
        )
        css = layout.to_css("bp3")
        assert "grid-template-columns: 1fr 1fr 1fr" in css
        assert "@media (min-width: 768px) and (max-width: 1023px)" in css
        assert "@media (max-width: 767px)" in css

    def test_to_css_with_rows(self):
        layout = GridLayout(
            key="with-rows",
            tracks={
                "lg": GridTrackConfig(
                    columns=["1fr", "2fr"],
                    rows=["auto", "1fr", "auto"],
                ),
            },
        )
        css = layout.to_css("rows1")
        assert "grid-template-rows: auto 1fr auto" in css

    def test_to_css_with_areas(self):
        layout = GridLayout(
            key="areas",
            tracks={
                "lg": GridTrackConfig(
                    columns=["1fr", "2fr", "1fr"],
                    rows=["auto", "1fr", "auto"],
                    areas=[
                        ["header", "header", "header"],
                        ["sidebar", "content", "aside"],
                        ["footer", "footer", "footer"],
                    ],
                ),
            },
        )
        css = layout.to_css("areas1")
        assert 'grid-template-areas: "header header header"' in css
        assert '"sidebar content aside"' in css
        assert '"footer footer footer"' in css

    def test_to_css_with_items(self):
        layout = GridLayout(
            key="items",
            tracks={"lg": GridTrackConfig(columns=["1fr", "1fr", "1fr"])},
            items={
                "header": {
                    "lg": GridAreaItem("header", 1, 4, 1, 2),
                },
            },
        )
        css = layout.to_css("items1")
        assert "grid-area: 1 / 1 / 2 / 4" in css
        assert ".section-items1 > .header" in css

    def test_to_css_custom_gap(self):
        layout = GridLayout(
            key="gap",
            tracks={"lg": GridTrackConfig(columns=["1fr", "1fr"], gap="2rem")},
        )
        css = layout.to_css("gap1")
        assert "gap: 2rem" in css

    def test_to_config(self):
        layout = GridLayout(
            key="test",
            label="Testlayout",
            tracks={
                "lg": GridTrackConfig(columns=["2fr", "1fr"], gap="2rem"),
                "sm": GridTrackConfig(columns=["1fr"]),
            },
        )
        config = layout.to_config()
        assert config["key"] == "test"
        assert config["label"] == "Testlayout"
        assert config["is_preset"] is True
        assert config["tracks"]["lg"]["columns"] == ["2fr", "1fr"]
        assert config["tracks"]["lg"]["gap"] == "2rem"
        assert config["tracks"]["sm"]["columns"] == ["1fr"]


class TestPresetLayouts:
    def test_all_six_presets_registered(self):
        expected = {
            "full", "two-col-equal", "two-col-left-wide",
            "two-col-right-wide", "three-col-equal", "four-col-equal",
        }
        assert set(PRESET_LAYOUTS.keys()) == expected

    def test_full_preset(self):
        layout = PRESET_LAYOUTS["full"]
        assert layout.column_count == 1
        css = layout.to_css("p1")
        assert "grid-template-columns: 1fr" in css

    def test_two_col_equal_responsive(self):
        layout = PRESET_LAYOUTS["two-col-equal"]
        assert layout.column_count == 2
        css = layout.to_css("p2")
        assert "1fr 1fr" in css
        assert "@media (max-width: 767px)" in css

    def test_three_col_has_md_breakpoint(self):
        layout = PRESET_LAYOUTS["three-col-equal"]
        assert "md" in layout.tracks
        css = layout.to_css("p3")
        assert "1fr 1fr 1fr" in css

    def test_four_col_has_md_breakpoint(self):
        layout = PRESET_LAYOUTS["four-col-equal"]
        assert "md" in layout.tracks
        assert layout.column_count == 4

    @pytest.mark.parametrize("key", PRESET_LAYOUTS.keys())
    def test_all_presets_generate_valid_css(self, key):
        layout = PRESET_LAYOUTS[key]
        css = layout.to_css(f"preset-{key}")
        assert "display: grid" in css
        assert f".section-preset-{key}" in css


class TestResolveGrid:
    def test_resolve_preset(self):
        layout = resolve_grid("full")
        assert layout.key == "full"
        assert layout.is_preset is True

    def test_resolve_unknown_key_raises(self):
        with pytest.raises(ValueError, match="Unbekannter Layout-Key"):
            resolve_grid("nonexistent")

    def test_resolve_custom_without_config_raises(self):
        with pytest.raises(ValueError, match="grid_config"):
            resolve_grid("custom")

    def test_resolve_custom_with_config(self):
        config = {
            "tracks": {
                "lg": {"columns": ["minmax(300px, 1fr)", "2fr"], "gap": "2rem"},
                "sm": {"columns": ["1fr"]},
            },
        }
        layout = resolve_grid("custom", config)
        assert layout.key == "custom"
        assert layout.is_preset is False
        assert layout.column_count == 2

    def test_resolve_custom_with_areas(self):
        config = {
            "label": "Dashboard Layout",
            "tracks": {
                "lg": {
                    "columns": ["200px", "1fr", "300px"],
                    "rows": ["60px", "1fr", "40px"],
                    "areas": [
                        ["header", "header", "header"],
                        ["nav", "main", "aside"],
                        ["footer", "footer", "footer"],
                    ],
                },
                "sm": {
                    "columns": ["1fr"],
                    "rows": ["auto"],
                    "areas": [
                        ["header"],
                        ["nav"],
                        ["main"],
                        ["aside"],
                        ["footer"],
                    ],
                },
            },
            "items": {
                "header": {
                    "lg": {"col_start": 1, "col_end": 4, "row_start": 1, "row_end": 2},
                    "sm": {"col_start": 1, "col_end": 2, "row_start": 1, "row_end": 2},
                },
            },
        }
        layout = resolve_grid("custom", config)
        assert layout.label == "Dashboard Layout"
        css = layout.to_css("dashboard")
        assert "grid-template-areas" in css
        assert '"header header header"' in css

    def test_resolve_custom_invalid_breakpoint_raises(self):
        with pytest.raises(ValueError, match="Ungueltiger Breakpoint"):
            resolve_grid("custom", {"tracks": {"xl": {"columns": ["1fr"]}}})

    def test_resolve_custom_empty_tracks_raises(self):
        with pytest.raises(ValueError, match="tracks darf nicht leer"):
            resolve_grid("custom", {"tracks": {}})
