import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    display_name: str | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=8)
    role: str = Field(default="editor", pattern="^(admin|editor)$")
    display_name: str | None = None


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    email: str | None = Field(default=None, min_length=5)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)
