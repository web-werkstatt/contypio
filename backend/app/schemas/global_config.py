from datetime import datetime

from pydantic import BaseModel


class GlobalRead(BaseModel):
    id: int
    slug: str
    label: str
    data: dict = {}
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class GlobalUpdate(BaseModel):
    data: dict
