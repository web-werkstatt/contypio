from datetime import datetime

from pydantic import BaseModel


class PageVersionRead(BaseModel):
    id: int
    page_id: int
    version_number: int
    title: str
    slug: str
    status: str
    change_summary: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PageVersionDetail(PageVersionRead):
    """Full version including content for restore/comparison."""

    seo: dict = {}
    hero: dict = {}
    sections: list = []
