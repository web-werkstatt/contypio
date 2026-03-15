"""Edition-Gate: Feature-Flags basierend auf Tenant-Edition.

Jeder Tenant hat eine `edition` (light|starter|pro|agency).
Das Gate entscheidet, welche Features verfuegbar sind.
"""
import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.models.tenant import CmsTenant


@dataclass(frozen=True)
class EditionLimits:
    max_pages: int
    max_media_mb: int
    max_users: int
    max_spaces: int
    max_sites: int


@dataclass(frozen=True)
class EditionFeatures:
    multi_tenant: bool
    white_label: bool
    custom_roles: bool
    webhooks: bool
    webhook_retry: bool
    webhook_logs: bool
    staging_env: bool
    analytics: bool
    content_stats: bool
    auto_backups: bool
    backup_restore: bool
    sso_oidc: bool
    api_keys: bool
    remove_branding: bool


# --- Edition Definitions ---

EDITION_LIMITS: dict[str, EditionLimits] = {
    "light": EditionLimits(max_pages=50, max_media_mb=500, max_users=3, max_spaces=1, max_sites=1),
    "starter": EditionLimits(max_pages=200, max_media_mb=2000, max_users=3, max_spaces=3, max_sites=3),
    "pro": EditionLimits(max_pages=1000, max_media_mb=10000, max_users=10, max_spaces=10, max_sites=10),
    "agency": EditionLimits(max_pages=99999, max_media_mb=99999, max_users=25, max_spaces=30, max_sites=30),
}

EDITION_FEATURES: dict[str, EditionFeatures] = {
    "light": EditionFeatures(
        multi_tenant=False, white_label=False, custom_roles=False,
        webhooks=True, webhook_retry=False, webhook_logs=False,
        staging_env=False, analytics=False, content_stats=False,
        auto_backups=False, backup_restore=False, sso_oidc=False,
        api_keys=False, remove_branding=False,
    ),
    "starter": EditionFeatures(
        multi_tenant=False, white_label=False, custom_roles=False,
        webhooks=True, webhook_retry=False, webhook_logs=False,
        staging_env=False, analytics=True, content_stats=False,
        auto_backups=True, backup_restore=False, sso_oidc=False,
        api_keys=False, remove_branding=False,
    ),
    "pro": EditionFeatures(
        multi_tenant=False, white_label=True, custom_roles=True,
        webhooks=True, webhook_retry=True, webhook_logs=True,
        staging_env=True, analytics=True, content_stats=True,
        auto_backups=True, backup_restore=True, sso_oidc=False,
        api_keys=True, remove_branding=True,
    ),
    "agency": EditionFeatures(
        multi_tenant=True, white_label=True, custom_roles=True,
        webhooks=True, webhook_retry=True, webhook_logs=True,
        staging_env=True, analytics=True, content_stats=True,
        auto_backups=True, backup_restore=True, sso_oidc=True,
        api_keys=True, remove_branding=True,
    ),
}

VALID_EDITIONS = set(EDITION_LIMITS.keys())


def get_limits(edition: str) -> EditionLimits:
    return EDITION_LIMITS.get(edition, EDITION_LIMITS["light"])


def get_features(edition: str) -> EditionFeatures:
    return EDITION_FEATURES.get(edition, EDITION_FEATURES["light"])


def has_feature(edition: str, feature: str) -> bool:
    """Check if an edition has a specific feature."""
    features = get_features(edition)
    return getattr(features, feature, False)


def get_edition_info(edition: str) -> dict:
    """Full edition info for frontend display."""
    limits = get_limits(edition)
    features = get_features(edition)
    return {
        "edition": edition,
        "limits": {
            "max_pages": limits.max_pages,
            "max_media_mb": limits.max_media_mb,
            "max_users": limits.max_users,
            "max_spaces": limits.max_spaces,
            "max_sites": limits.max_sites,
        },
        "features": {
            field: getattr(features, field)
            for field in EditionFeatures.__dataclass_fields__
        },
    }


# --- FastAPI Dependencies ---

def require_feature(feature: str):
    """Dependency: Block request if tenant edition lacks the feature."""
    async def checker(
        user: CmsUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> CmsUser:
        tenant = await db.get(CmsTenant, user.tenant_id)
        edition = tenant.edition if tenant else "light"
        if not has_feature(edition, feature):
            raise HTTPException(
                status_code=403,
                detail=f"Feature '{feature}' ist in der {edition}-Edition nicht verfuegbar. Upgrade erforderlich.",
            )
        return user
    return checker


def require_module(module_key: str):
    """Dependency: Block request if module is not active for tenant."""
    from app.services.module_registry import is_module_active

    async def checker(
        user: CmsUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> CmsUser:
        tenant = await db.get(CmsTenant, user.tenant_id)
        if not tenant or not is_module_active(tenant, module_key):
            raise HTTPException(
                status_code=403,
                detail=f"Modul '{module_key}' ist nicht aktiviert.",
            )
        return user
    return checker
