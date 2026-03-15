from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.core.grid import resolve_grid

LayoutKey = Literal[
    "full", "two-col-equal", "two-col-left-wide", "two-col-right-wide",
    "three-col-equal", "four-col-equal",
    "custom",
]

LAYOUT_COLUMN_COUNT: dict[str, int] = {
    "full": 1,
    "two-col-equal": 2,
    "two-col-left-wide": 2,
    "two-col-right-wide": 2,
    "three-col-equal": 3,
    "four-col-equal": 4,
}


class Block(BaseModel):
    id: str
    blockType: str
    data: dict = Field(default_factory=dict)


class Column(BaseModel):
    id: str
    blocks: list[Block] = Field(default_factory=list)


class SectionBackground(BaseModel):
    color: str = "#ffffff"
    image: str = ""


class SectionSpacing(BaseModel):
    paddingTop: str = "48px"
    paddingBottom: str = "48px"


class GridTrackConfigSchema(BaseModel):
    """Track config for one breakpoint."""
    columns: list[str] = Field(min_length=1, max_length=12)
    rows: list[str] | None = None
    gap: str = "1.5rem"
    areas: list[list[str]] | None = None


class GridConfigSchema(BaseModel):
    """Custom grid configuration stored in section JSON."""
    label: str = "Benutzerdefiniert"
    tracks: dict[str, GridTrackConfigSchema] = Field(min_length=1)
    items: dict[str, dict[str, dict]] | None = None


class Section(BaseModel):
    id: str
    layout: LayoutKey = "full"
    grid_config: GridConfigSchema | None = None
    background: SectionBackground = Field(default_factory=SectionBackground)
    spacing: SectionSpacing = Field(default_factory=SectionSpacing)
    columns: list[Column] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_layout(self):
        if self.layout == "custom":
            if not self.grid_config:
                raise ValueError("Layout 'custom' braucht grid_config")
            # Validate via grid engine (checks CSS values against allowlist)
            try:
                grid = resolve_grid("custom", self.grid_config.model_dump())
            except ValueError as e:
                raise ValueError(f"grid_config ungueltig: {e}") from e
            # Column count from lg breakpoint
            expected = grid.column_count
            if self.columns and len(self.columns) != expected:
                raise ValueError(
                    f"Custom Layout hat {expected} Spalten (lg), "
                    f"aber {len(self.columns)} Columns geliefert"
                )
        else:
            # Preset layout: validate column count from preset registry
            expected = LAYOUT_COLUMN_COUNT.get(self.layout, 1)
            if self.columns and len(self.columns) != expected:
                raise ValueError(
                    f"Layout '{self.layout}' braucht {expected} Spalten, "
                    f"hat {len(self.columns)}"
                )
        return self
