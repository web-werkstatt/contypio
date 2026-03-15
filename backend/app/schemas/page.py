from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.section import Section


class PageCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    path: str = Field(min_length=1, max_length=500)
    page_type: str = "content"
    parent_id: int | None = None
    collection_key: str | None = None
    sort_order: int = 0
    seo: dict = Field(default_factory=dict)
    hero: dict = Field(default_factory=dict)
    sections: list[Section] = Field(default_factory=list)


class PageUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    path: str | None = None
    page_type: str | None = None
    status: str | None = None
    parent_id: int | None = None
    collection_key: str | None = Field(default=None)
    sort_order: int | None = None
    seo: dict | None = None
    hero: dict | None = None
    sections: list[Section] | None = None
    published_at: datetime | None = None


class PageRead(BaseModel):
    id: int
    title: str
    slug: str
    path: str
    page_type: str
    status: str
    seo: dict = {}
    hero: dict = {}
    sections: list = []
    parent_id: int | None = None
    collection_key: str | None = None
    sort_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PageTreeItem(BaseModel):
    id: int
    title: str
    slug: str
    path: str
    status: str
    page_type: str
    sort_order: int = 0
    updated_at: datetime | None = None
    children: list["PageTreeItem"] = Field(default_factory=list)

    model_config = {"from_attributes": True}
