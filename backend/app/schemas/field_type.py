from pydantic import BaseModel


class FieldTypePresetRead(BaseModel):
    id: int
    type_key: str
    label: str
    category: str
    render: str
    config: dict
    has_options: bool
    has_sub_fields: bool
    list_visible: bool
    sort_order: int

    model_config = {"from_attributes": True}
