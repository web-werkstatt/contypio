"""Translation CRUD operations for content entities."""
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.content_i18n import compute_completeness, validate_locale
from app.models.collection import CmsCollection
from app.models.global_config import CmsGlobal
from app.models.page import CmsPage

# Type alias for any translatable entity
TranslatableEntity = CmsPage | CmsCollection | CmsGlobal


def get_translations(entity: TranslatableEntity) -> dict[str, dict]:
    """Return the translations dict from any content entity."""
    return entity.translations or {}


async def update_translation(
    entity: TranslatableEntity,
    locale: str,
    data: dict[str, Any],
    db: AsyncSession,
) -> dict[str, dict]:
    """Set/merge translation data for a locale on an entity.

    Merges new data into existing locale translations (does not replace).
    Returns the full updated translations dict.
    """
    locale = validate_locale(locale)
    translations = dict(entity.translations or {})
    existing = dict(translations.get(locale, {}))
    existing.update(data)
    translations[locale] = existing
    entity.translations = translations
    await db.commit()
    await db.refresh(entity)
    return entity.translations or {}


async def delete_translation(
    entity: TranslatableEntity,
    locale: str,
    db: AsyncSession,
) -> bool:
    """Remove a locale's translations entirely. Returns True if locale existed."""
    locale = validate_locale(locale)
    translations = dict(entity.translations or {})
    if locale not in translations:
        return False
    del translations[locale]
    entity.translations = translations
    await db.commit()
    return True


def get_completeness_map(
    entity: TranslatableEntity,
    translatable_fields: set[str],
    tenant_locales: list[str],
) -> list[dict]:
    """Return completeness scores for all tenant locales."""
    translations = entity.translations or {}
    result = []
    for loc in tenant_locales:
        score = compute_completeness(translations, translatable_fields, loc)
        result.append({"locale": loc, "completeness": score})
    return result
