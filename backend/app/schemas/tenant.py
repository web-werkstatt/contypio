import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TenantRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    domain: str | None
    logo_url: str | None
    primary_color: str | None
    accent_color: str | None
    favicon_url: str | None
    industry: str | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantBrandingRead(BaseModel):
    """Lightweight branding info for the frontend."""
    name: str
    logo_url: str | None
    primary_color: str
    accent_color: str | None
    favicon_url: str | None

    model_config = {"from_attributes": True}


class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    domain: str | None = None
    logo_url: str | None = None
    primary_color: str | None = Field(default="#2563eb", max_length=20)
    accent_color: str | None = None
    favicon_url: str | None = None
    industry: str | None = Field(default="neutral", pattern=r"^(travel|agency|neutral)$")


class TenantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    domain: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    favicon_url: str | None = None
    industry: str | None = None
    active: bool | None = None


class OnboardingRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    domain: str = Field(default="", max_length=255)
    industry: str = Field(default="neutral", pattern=r"^(travel|agency|neutral)$")
    admin_email: str = Field(min_length=5)
    admin_password: str = Field(min_length=8)
    admin_name: str = Field(default="Admin", max_length=255)


class OnboardingResponse(BaseModel):
    tenant: TenantRead
    access_token: str
    message: str
