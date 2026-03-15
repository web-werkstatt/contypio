import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session, engine
from app.core.i18n import LocaleMiddleware
from app.models import Base
from app.models.tenant import CmsTenant

logger = logging.getLogger("cms")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


async def seed_defaults(session, user_model, hash_fn):
    result = await session.execute(select(CmsTenant).where(CmsTenant.slug == settings.DEFAULT_TENANT_SLUG))
    tenant = result.scalar_one_or_none()

    if not tenant:
        tenant = CmsTenant(
            name=settings.DEFAULT_TENANT_NAME,
            slug=settings.DEFAULT_TENANT_SLUG,
            domain=settings.DEFAULT_TENANT_DOMAIN,
        )
        session.add(tenant)
        await session.flush()
        logger.info("Created default tenant: %s", tenant.slug)

    result = await session.execute(select(user_model).where(user_model.tenant_id == tenant.id).limit(1))
    if not result.scalar_one_or_none():
        admin = user_model(
            tenant_id=tenant.id,
            email=settings.DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_fn(settings.DEFAULT_ADMIN_PASSWORD),
            role="admin",
            display_name=settings.DEFAULT_ADMIN_NAME,
        )
        session.add(admin)
        logger.info("Created default admin user: %s", settings.DEFAULT_ADMIN_EMAIL)

    await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so metadata knows about them
    from app.auth.models import CmsUser  # noqa: F811
    from app.auth.security import hash_password
    from app.models.collection import CmsCollection, CmsCollectionSchema  # noqa: F401
    from app.models.field_type import CmsFieldTypePreset  # noqa: F401
    from app.models.global_config import CmsGlobal  # noqa: F401
    from app.models.media import CmsMedia  # noqa: F401
    from app.models.page import CmsPage  # noqa: F401
    from app.models.page_version import CmsPageVersion  # noqa: F401
    from app.models.webhook import CmsWebhook, CmsWebhookLog  # noqa: F401
    from app.auth.api_key import CmsApiKey  # noqa: F401
    from app.models.content_template import CmsContentTemplate  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as session:
        await seed_defaults(session, CmsUser, hash_password)
    # Seed collections + globals + field type presets
    from app.services.seed_collections import seed_collections_and_globals, seed_field_type_presets
    async with async_session() as session:
        tenant_result = await session.execute(select(CmsTenant).where(CmsTenant.slug == settings.DEFAULT_TENANT_SLUG))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            await seed_collections_and_globals(tenant.id, session)
    async with async_session() as session:
        tenant_result = await session.execute(select(CmsTenant).where(CmsTenant.slug == settings.DEFAULT_TENANT_SLUG))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            await seed_field_type_presets(tenant.id, session)
    logger.info("CMS API started")
    yield
    await engine.dispose()


app = FastAPI(
    title="Contypio API",
    version="0.1.0",
    docs_url="/docs",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "Content Delivery API",
            "description": "Public endpoints for fetching published content. No authentication required. Supports caching (ETag, Cache-Control), pagination, sorting and filtering.",
        },
        {
            "name": "Admin API",
            "description": "Authenticated endpoints for managing content, media, collections and settings. Requires JWT authentication.",
        },
    ],
)

# RFC 7807 error handlers
from app.core.error_handler import register_error_handlers
register_error_handlers(app)

from app.core.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.https_enforcement import HTTPSEnforcementMiddleware
from app.middleware.tenant_cors import TenantAwareCORSMiddleware

# ---------------------------------------------------------------------------
# Middleware stack (LIFO: last added = first executed on request)
# Order matters for security — see docs/api-roadmap-v1.md
# ---------------------------------------------------------------------------

# Inner layers (executed last on request, first on response)
app.add_middleware(LocaleMiddleware)
app.add_middleware(RateLimitMiddleware)

# Outer layers — must be added before CORS wrapping (LIFO: last added = first executed)
# S1: API-specific security headers (CSP, Permissions-Policy, etc.)
app.add_middleware(SecurityHeadersMiddleware)
# S2: HTTPS fallback — Caddy handles primary HTTPS enforcement
app.add_middleware(HTTPSEnforcementMiddleware)

from app.auth.routes import router as auth_router
from app.api.media_folders import router as media_folders_router
from app.api.media import router as media_router
from app.api.pages import router as pages_router
from app.api.block_types import router as config_router
from app.api.page_assembly import router as assembly_router
from app.api.autofill import router as autofill_router
from app.delivery.pages import router as delivery_router
from app.delivery.preview import router as preview_router
from app.delivery.cache import router as cache_router
from app.api.collections import router as collections_router
from app.api.field_types import router as field_types_router
from app.api.globals import router as globals_router
from app.delivery.collections import router as delivery_collections_router, collections_plural_router as delivery_collections_plural_router
from app.delivery.globals import router as delivery_globals_router
from app.delivery.locales import router as delivery_locales_router
from app.api.imports import router as import_router, export_router
from app.api.tenants import router as tenants_router
from app.api.page_versions import router as page_versions_router
from app.api.billing import router as billing_router
from app.api.pricing import router as pricing_router
from app.api.webhooks import router as webhooks_router
from app.api.modules import router as modules_router
from app.api.website_import import router as website_import_router
from app.api.api_keys import router as api_keys_router
from app.api.ai_fields import router as ai_fields_router
from app.api.content_templates import router as content_templates_router

# Load all importers
from app.importers.registry import load_all as load_importers
load_importers()

app.include_router(auth_router)
app.include_router(media_folders_router)
app.include_router(media_router)
app.include_router(pages_router)
app.include_router(config_router)
app.include_router(assembly_router)
app.include_router(autofill_router)
app.include_router(collections_router)
app.include_router(field_types_router)
app.include_router(globals_router)
app.include_router(delivery_router)
app.include_router(preview_router)
app.include_router(cache_router)
app.include_router(delivery_collections_router)
app.include_router(delivery_collections_plural_router)
app.include_router(delivery_globals_router)
app.include_router(delivery_locales_router)
app.include_router(import_router)
app.include_router(export_router)
app.include_router(tenants_router)
app.include_router(page_versions_router)
app.include_router(billing_router)
app.include_router(pricing_router)
app.include_router(webhooks_router)
app.include_router(modules_router)
app.include_router(website_import_router)
app.include_router(api_keys_router)
app.include_router(ai_fields_router)
app.include_router(content_templates_router)


import os
from pathlib import Path

# Static assets (CSS, JS) - must be mounted BEFORE /uploads
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# S3: Tenant-aware CORS — raw ASGI wrapper (outermost layer)
# Must be LAST because it replaces the FastAPI app object.
# Origins loaded per tenant from DB. Default: deny all.
# ---------------------------------------------------------------------------
app = TenantAwareCORSMiddleware(app)
