from datetime import datetime

from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: int | None = None


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: int | None = None


class FolderRead(BaseModel):
    id: int
    name: str
    parent_id: int | None = None
    position: int = 0
    created_at: datetime
    file_count: int = 0
    subfolder_count: int = 0

    model_config = {"from_attributes": True}


class BreadcrumbItem(BaseModel):
    id: int
    name: str
