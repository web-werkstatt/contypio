from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

# Legacy type -> (render, config, list_visible) mapping for backwards compat
_TYPE_MIGRATE: dict[str, tuple[str, dict, bool]] = {
    "text": ("input", {"inputType": "text"}, True),
    "email": ("input", {"inputType": "email"}, True),
    "phone": ("input", {"inputType": "tel", "pattern": "^[0-9+ ()-]+$", "placeholder": "+49..."}, True),
    "url": ("input", {"inputType": "url"}, True),
    "number": ("input", {"inputType": "number"}, True),
    "date": ("input", {"inputType": "date"}, True),
    "textarea": ("textarea", {"rows": 3}, False),
    "richtext": ("textarea", {"rows": 5, "monospace": True, "placeholder": "HTML/Markdown"}, False),
    "select": ("select", {}, True),
    "toggle": ("checkbox", {}, True),
    "boolean": ("checkbox", {}, True),
    "color": ("color", {}, True),
    "media": ("input", {"inputType": "number", "placeholder": "Media ID"}, False),
    "media-picker": ("media-picker", {}, False),
    "group": ("group", {}, False),
    "repeater": ("repeater", {}, False),
    "relation": ("relation", {"collection": "", "display_field": "title", "multiple": False}, True),
}


class FieldDef(BaseModel):
    name: str
    label: str
    required: bool = False
    render: str = "input"
    config: dict = {}
    type: str = "text"
    list_visible: bool = True
    options: list[str] | None = None
    fields: list["FieldDef"] | None = None
    min_items: int | None = None
    max_items: int | None = None

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_type(cls, data: dict) -> dict:
        if not isinstance(data, dict):
            return data
        # If render is not explicitly set but type is, derive render+config from type
        if "render" not in data and "type" in data:
            mapping = _TYPE_MIGRATE.get(data["type"])
            if mapping:
                data["render"] = mapping[0]
                merged_config = {**mapping[1], **data.get("config", {})}
                data["config"] = merged_config
                data["list_visible"] = mapping[2]
        return data


class CollectionSchemaRead(BaseModel):
    id: int
    collection_key: str
    label: str
    label_singular: str
    icon: str
    fields: list[FieldDef] = []
    slug_field: str | None = None
    title_field: str = "title"
    sort_field: str = "sort_order"
    created_at: datetime

    model_config = {"from_attributes": True}


class CollectionSchemaCreate(BaseModel):
    collection_key: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    label: str = Field(min_length=1, max_length=255)
    label_singular: str = Field(min_length=1, max_length=255)
    icon: str = Field(default="Database", max_length=50)
    fields: list[FieldDef] = Field(default_factory=list)
    title_field: str = Field(default="title", max_length=100)
    slug_field: str | None = Field(default=None, max_length=100)
    sort_field: str = Field(default="sort_order", max_length=100)


class CollectionSchemaUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    label_singular: str | None = Field(default=None, min_length=1, max_length=255)
    icon: str | None = Field(default=None, max_length=50)
    fields: list[FieldDef] | None = None
    title_field: str | None = Field(default=None, max_length=100)
    slug_field: str | None = Field(default=None, max_length=100)
    sort_field: str | None = Field(default=None, max_length=100)


class CollectionItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = None
    data: dict = Field(default_factory=dict)
    status: Literal["draft", "published"] = "published"
    sort_order: int = 0
    image_id: int | None = None


class CollectionItemUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    data: dict | None = None
    status: Literal["draft", "published"] | None = None
    sort_order: int | None = None
    image_id: int | None = None


class ImportPreviewResponse(BaseModel):
    columns: list[str]
    rows_preview: list[dict]
    total_rows: int


class ImportExecuteRequest(BaseModel):
    rows: list[dict]
    field_mapping: dict[str, str]
    title_column: str
    status: Literal["draft", "published"] = "draft"
    conflict: Literal["skip", "overwrite"] = "skip"


class ImportExecuteResponse(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = []


class ReorderRequest(BaseModel):
    item_ids: list[int] = Field(min_length=1)


class BulkDeleteRequest(BaseModel):
    ids: list[int] = Field(min_length=1)


class CollectionItemRead(BaseModel):
    id: int
    collection_key: str
    slug: str | None = None
    title: str
    data: dict = {}
    status: str
    sort_order: int = 0
    image_id: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}
