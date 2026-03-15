from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://cms_user:cms_pass@cms-postgres:5432/cms_db"
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ["http://localhost:8061"]
    UPLOAD_DIR: str = "/app/uploads"
    API_ASSET_URL: str = "http://localhost:8060"

    # Tenant defaults (used for initial seeding)
    DEFAULT_TENANT_SLUG: str = "default"
    DEFAULT_TENANT_NAME: str = "My Website"
    DEFAULT_TENANT_DOMAIN: str = "localhost"
    DEFAULT_ADMIN_EMAIL: str = "admin@example.com"
    DEFAULT_ADMIN_PASSWORD: str = "changeme"
    DEFAULT_ADMIN_NAME: str = "Admin"
    DEFAULT_SITE_NAME: str = "My Website"
    DEFAULT_SITE_TAGLINE: str = ""
    DEFAULT_LANGUAGE: str = "en"

    # Security
    ENFORCE_HTTPS: bool = False  # True in production, Caddy handles primary HTTPS

    # AI (optional, OpenAI-kompatibel)
    AI_ENDPOINT_URL: str = ""
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_MAX_TOKENS: int = 500

    # Stripe (optional, nur aktiv wenn billing_enabled=True pro Tenant)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLIC_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
