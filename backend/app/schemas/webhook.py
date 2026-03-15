"""Pydantic schemas for webhook management."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.services.webhook_service import WEBHOOK_EVENTS


class WebhookCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=10, max_length=2048)
    events: list[str] = Field(min_length=1)

    def validate_events(self) -> None:
        invalid = [e for e in self.events if e not in WEBHOOK_EVENTS]
        if invalid:
            raise ValueError(f"Ungueltige Events: {', '.join(invalid)}")


class WebhookUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    url: str | None = Field(None, min_length=10, max_length=2048)
    events: list[str] | None = None
    active: bool | None = None


class WebhookResponse(BaseModel):
    id: uuid.UUID
    name: str
    url: str
    events: list[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WebhookWithSecret(WebhookResponse):
    """Returned only on creation - includes the secret."""
    secret: str


class WebhookLogResponse(BaseModel):
    id: uuid.UUID
    event: str
    payload: dict
    status_code: int | None
    response_body: str | None
    success: bool
    duration_ms: int | None
    attempt: int
    created_at: datetime

    model_config = {"from_attributes": True}
