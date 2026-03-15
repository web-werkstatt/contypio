"""Pydantic schemas for API key management."""

from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    scopes: list[str] = Field(default=["*"])
    expires_at: datetime | None = None


class ApiKeyRead(BaseModel):
    id: int
    name: str
    key_prefix: str
    scopes: list[str]
    active: bool
    expires_at: datetime | None = None
    last_used_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyRead):
    raw_key: str
