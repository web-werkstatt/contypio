import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.auth.models import CmsUser
from app.auth.security import create_access_token, hash_password
from app.core.database import get_db
from app.models.tenant import CmsTenant
from app.schemas.tenant import (
    OnboardingRequest,
    OnboardingResponse,
    TenantBrandingRead,
    TenantCreate,
    TenantRead,
    TenantUpdate,
)
from app.services.edition_gate import get_edition_info, EDITION_LIMITS
from app.services.usage_service import get_usage_with_limits

logger = logging.getLogger("cms")

router = APIRouter(prefix="/api/tenants", tags=["tenants"])

# --- Industry Starter Packs ---

STARTER_COLLECTIONS: dict[str, list[dict]] = {
    "travel": [
        {
            "collection_key": "destinations",
            "label": "Reiseziele",
            "label_singular": "Reiseziel",
            "icon": "Globe",
            "title_field": "title",
            "slug_field": "slug",
            "sort_field": "sort_order",
            "fields": [
                {"name": "title", "type": "text", "label": "Titel", "required": True},
                {"name": "slug", "type": "text", "label": "Slug", "required": True},
                {"name": "continent", "type": "select", "label": "Kontinent", "options": ["Europa", "Asien", "Afrika", "Nordamerika", "Suedamerika", "Ozeanien"]},
                {"name": "country", "type": "text", "label": "Land"},
                {"name": "hero_image", "type": "media", "label": "Hero Bild"},
                {"name": "intro_text", "type": "richtext", "label": "Intro Text"},
            ],
        },
        {
            "collection_key": "reise-themen",
            "label": "Reise-Themen",
            "label_singular": "Reise-Thema",
            "icon": "Tag",
            "title_field": "name",
            "slug_field": "slug",
            "sort_field": "sort_order",
            "fields": [
                {"name": "name", "type": "text", "label": "Name", "required": True},
                {"name": "slug", "type": "text", "label": "Slug", "required": True},
                {"name": "image", "type": "media", "label": "Bild"},
                {"name": "beschreibung", "type": "richtext", "label": "Beschreibung"},
            ],
        },
    ],
    "agency": [
        {
            "collection_key": "services",
            "label": "Leistungen",
            "label_singular": "Leistung",
            "icon": "Briefcase",
            "title_field": "title",
            "slug_field": "slug",
            "sort_field": "sort_order",
            "fields": [
                {"name": "title", "type": "text", "label": "Titel", "required": True},
                {"name": "slug", "type": "text", "label": "Slug", "required": True},
                {"name": "description", "type": "richtext", "label": "Beschreibung"},
                {"name": "image", "type": "media", "label": "Bild"},
                {"name": "price", "type": "text", "label": "Preis"},
            ],
        },
        {
            "collection_key": "clients",
            "label": "Kunden",
            "label_singular": "Kunde",
            "icon": "Users",
            "title_field": "name",
            "slug_field": None,
            "sort_field": "sort_order",
            "fields": [
                {"name": "name", "type": "text", "label": "Name", "required": True},
                {"name": "logo", "type": "media", "label": "Logo"},
                {"name": "website", "type": "url", "label": "Website"},
                {"name": "testimonial", "type": "textarea", "label": "Testimonial"},
            ],
        },
    ],
    "neutral": [
        {
            "collection_key": "articles",
            "label": "Artikel",
            "label_singular": "Artikel",
            "icon": "FileText",
            "title_field": "title",
            "slug_field": "slug",
            "sort_field": "sort_order",
            "fields": [
                {"name": "title", "type": "text", "label": "Titel", "required": True},
                {"name": "slug", "type": "text", "label": "Slug", "required": True},
                {"name": "content", "type": "richtext", "label": "Inhalt"},
                {"name": "image", "type": "media", "label": "Bild"},
                {"name": "category", "type": "text", "label": "Kategorie"},
            ],
        },
    ],
}

# Shared starter collections for all industries
SHARED_STARTER_COLLECTIONS: list[dict] = [
    {
        "collection_key": "team-members",
        "label": "Team",
        "label_singular": "Teammitglied",
        "icon": "Users",
        "title_field": "name",
        "slug_field": None,
        "sort_field": "sort_order",
        "fields": [
            {"name": "name", "type": "text", "label": "Name", "required": True},
            {"name": "rolle", "type": "text", "label": "Rolle"},
            {"name": "foto", "type": "media", "label": "Foto"},
            {"name": "email", "type": "email", "label": "E-Mail"},
            {"name": "bio", "type": "richtext", "label": "Biografie"},
        ],
    },
]


def _slug_from_name(name: str) -> str:
    """Generate a URL-safe slug from a name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:100] or "tenant"


@router.get("", response_model=list[TenantRead])
async def list_tenants(
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Liste aller Tenants (nur Admins)."""
    result = await db.execute(select(CmsTenant).order_by(CmsTenant.name))
    return list(result.scalars().all())


@router.get("/current", response_model=TenantRead)
async def get_current_tenant(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aktuellen Tenant des eingeloggten Users."""
    result = await db.execute(select(CmsTenant).where(CmsTenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.get("/current/branding", response_model=TenantBrandingRead)
async def get_current_branding(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Branding-Daten des aktuellen Tenants."""
    result = await db.execute(select(CmsTenant).where(CmsTenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantBrandingRead(
        name=tenant.name,
        logo_url=tenant.logo_url,
        primary_color=tenant.primary_color or "#2563eb",
        accent_color=tenant.accent_color,
        favicon_url=tenant.favicon_url,
    )


@router.get("/current/edition")
async def get_current_edition(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edition-Info inkl. Features und Limits des aktuellen Tenants."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    info = get_edition_info(tenant.edition)
    info["all_editions"] = {
        name: {
            "max_pages": lim.max_pages,
            "max_media_mb": lim.max_media_mb,
            "max_users": lim.max_users,
            "max_spaces": lim.max_spaces,
            "max_sites": lim.max_sites,
        }
        for name, lim in EDITION_LIMITS.items()
    }
    return info


@router.put("/current/edition")
async def set_current_edition(
    data: dict,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Edition des eigenen Tenants aendern (nur Admin)."""
    edition = data.get("edition", "").strip().lower()
    if edition not in EDITION_LIMITS:
        raise HTTPException(status_code=400, detail=f"Ungueltige Edition: {edition}. Erlaubt: {', '.join(EDITION_LIMITS.keys())}")
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.edition = edition
    await db.flush()
    await db.refresh(tenant)
    info = get_edition_info(tenant.edition)
    info["all_editions"] = {
        name: {
            "max_pages": lim.max_pages,
            "max_media_mb": lim.max_media_mb,
            "max_users": lim.max_users,
            "max_spaces": lim.max_spaces,
            "max_sites": lim.max_sites,
        }
        for name, lim in EDITION_LIMITS.items()
    }
    return info


@router.get("/current/usage")
async def get_current_usage(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Usage-Daten des aktuellen Tenants (Seiten, Media, Users vs. Limits)."""
    return await get_usage_with_limits(user.tenant_id, db)


@router.post("", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Neuen Tenant erstellen (nur Admins)."""
    existing = await db.execute(select(CmsTenant).where(CmsTenant.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tenant slug already exists")

    tenant = CmsTenant(**data.model_dump())
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    logger.info("Created tenant: %s (%s)", tenant.name, tenant.slug)
    return tenant


@router.patch("/{tenant_id}", response_model=TenantRead)
async def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Tenant aktualisieren (nur Admins)."""
    result = await db.execute(select(CmsTenant).where(CmsTenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    await db.flush()
    await db.refresh(tenant)
    logger.info("Updated tenant: %s", tenant.slug)
    return tenant


@router.post("/onboard", response_model=OnboardingResponse, status_code=status.HTTP_201_CREATED)
async def onboard_tenant(
    data: OnboardingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Onboarding: Erstellt Tenant + Starter-Pack Collections + Admin-User.

    Oeffentlicher Endpoint (kein Auth noetig) fuer Self-Service-Registrierung.
    """
    slug = _slug_from_name(data.name)

    # Check uniqueness
    existing = await db.execute(select(CmsTenant).where(CmsTenant.slug == slug))
    if existing.scalar_one_or_none():
        # Try with a numeric suffix
        for i in range(2, 100):
            candidate = f"{slug}-{i}"
            check = await db.execute(select(CmsTenant).where(CmsTenant.slug == candidate))
            if not check.scalar_one_or_none():
                slug = candidate
                break
        else:
            raise HTTPException(status_code=409, detail="Tenant name already taken")

    # Check email uniqueness across all tenants
    existing_email = await db.execute(select(CmsUser).where(CmsUser.email == data.admin_email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="E-Mail-Adresse bereits registriert")

    # 1. Create tenant
    tenant = CmsTenant(
        name=data.name,
        slug=slug,
        domain=data.domain or None,
        industry=data.industry,
    )
    db.add(tenant)
    await db.flush()

    # 2. Create admin user
    admin_user = CmsUser(
        tenant_id=tenant.id,
        email=data.admin_email,
        hashed_password=hash_password(data.admin_password),
        role="admin",
        display_name=data.admin_name,
    )
    db.add(admin_user)
    await db.flush()

    # 3. Seed starter collections based on industry
    from app.models.collection import CmsCollectionSchema

    industry_collections = STARTER_COLLECTIONS.get(data.industry, STARTER_COLLECTIONS["neutral"])
    all_collections = industry_collections + SHARED_STARTER_COLLECTIONS

    for schema_data in all_collections:
        obj = CmsCollectionSchema(tenant_id=tenant.id, **schema_data)
        db.add(obj)
    logger.info("Seeded %d starter collections for tenant %s", len(all_collections), slug)

    # 4. Seed default globals
    from app.models.global_config import CmsGlobal

    default_globals = [
        {
            "slug": "site-settings",
            "label": "Site Settings",
            "data": {"site_name": data.name, "tagline": "", "contact_email": data.admin_email},
        },
        {
            "slug": "navigation",
            "label": "Navigation",
            "data": {
                "main_menu": [
                    {"label": "Startseite", "href": "/", "children": []},
                    {"label": "Kontakt", "href": "/kontakt", "children": []},
                ],
                "footer_links": [
                    {"label": "Impressum", "href": "/impressum"},
                    {"label": "Datenschutz", "href": "/datenschutz"},
                ],
            },
        },
        {
            "slug": "social-media",
            "label": "Social Media",
            "data": {"instagram": "", "facebook": "", "youtube": ""},
        },
    ]
    for global_data in default_globals:
        obj = CmsGlobal(tenant_id=tenant.id, **global_data)
        db.add(obj)

    # 5. Seed field type presets
    from app.services.seed_collections import FIELD_TYPE_PRESETS
    from app.models.field_type import CmsFieldTypePreset

    for preset_data in FIELD_TYPE_PRESETS:
        obj = CmsFieldTypePreset(tenant_id=tenant.id, **preset_data)
        db.add(obj)

    await db.flush()
    await db.refresh(tenant)
    await db.refresh(admin_user)

    # Generate access token
    token = create_access_token({
        "sub": str(admin_user.id),
        "tenant_id": str(tenant.id),
        "role": admin_user.role,
    })

    logger.info("Onboarded tenant: %s (industry=%s)", tenant.slug, data.industry)

    return OnboardingResponse(
        tenant=TenantRead.model_validate(tenant),
        access_token=token,
        message=f"Tenant '{data.name}' erfolgreich erstellt",
    )


# ---------------------------------------------------------------------------
# Locale Configuration (i18n)
# ---------------------------------------------------------------------------

from pydantic import BaseModel


class TenantLocaleUpdate(BaseModel):
    locales: list[str]
    default_language: str | None = None
    fallback_chain: dict[str, list[str]] | None = None


@router.put("/current/locales")
async def update_tenant_locales(
    body: TenantLocaleUpdate,
    user: CmsUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Set enabled locales and fallback chain for the current tenant."""
    from app.core.content_i18n import validate_locale

    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Validate all locale codes
    for loc in body.locales:
        try:
            validate_locale(loc)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid locale: {loc}")

    tenant.locales = body.locales
    if body.default_language is not None:
        try:
            validate_locale(body.default_language)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid default_language: {body.default_language}")
        tenant.default_language = body.default_language

    if body.fallback_chain is not None:
        tenant.fallback_chain = body.fallback_chain

    await db.flush()
    await db.refresh(tenant)

    return {
        "locales": tenant.locales,
        "default_language": tenant.default_language,
        "fallback_chain": tenant.fallback_chain,
    }


@router.get("/current/locales")
async def get_tenant_locales(
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get locale configuration for the current tenant."""
    tenant = await db.get(CmsTenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "locales": tenant.locales or [],
        "default_language": tenant.default_language,
        "fallback_chain": tenant.fallback_chain or {},
    }
