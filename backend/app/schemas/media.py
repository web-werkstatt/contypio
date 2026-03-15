from datetime import datetime

from pydantic import BaseModel, Field


class MediaRead(BaseModel):
    id: int
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    width: int | None = None
    height: int | None = None
    alt: str = ""
    caption: str | None = None
    category: str = "general"
    folder_id: int | None = None
    tags: list[str] = []
    url: str
    sizes: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class MediaUpdate(BaseModel):
    alt: str | None = None
    caption: str | None = None
    category: str | None = None
    folder_id: int | None = None
    tags: list[str] | None = None


class MediaList(BaseModel):
    items: list[MediaRead]
    total: int
    page: int
    per_page: int


class BulkMoveRequest(BaseModel):
    ids: list[int] = Field(max_length=100)
    folder_id: int | None = None


class BulkDeleteRequest(BaseModel):
    ids: list[int] = Field(max_length=100)


class BulkTagRequest(BaseModel):
    ids: list[int] = Field(max_length=100)
    tags: list[str]
    action: str = Field(pattern="^(add|remove)$")
