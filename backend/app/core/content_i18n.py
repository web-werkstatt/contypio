"""Content i18n: locale resolution, fallback chains, field merging.

Handles field-level internationalization for CmsPage, CmsCollection, CmsGlobal.
Translations are stored in a `translations` JSONB column per entity.
Default-locale content stays in existing columns (backwards-compatible).
"""
import re
from typing import Any

# BCP 47: language code (2 lowercase) + optional region (2 uppercase)
_BCP47_RE = re.compile(r"^[a-z]{2}(?:-[A-Z]{2})?$")

# Translatable fields per content type
PAGE_TRANSLATABLE_FIELDS = {"title", "seo", "hero", "sections"}
COLLECTION_TRANSLATABLE_FIELDS = {"title", "data"}
GLOBAL_TRANSLATABLE_FIELDS = {"label", "data"}


def validate_locale(locale: str) -> str:
    """Validate and normalize a BCP 47 locale string.

    Accepts: "de", "en", "de-AT", "fr-FR".
    Raises ValueError for invalid formats.
    """
    locale = locale.strip()
    if not _BCP47_RE.match(locale):
        raise ValueError(f"Invalid BCP 47 locale: {locale!r}")
    return locale


def build_fallback_chain(
    locale: str,
    tenant_default: str,
    custom_chain: dict[str, list[str]] | None = None,
) -> list[str]:
    """Build ordered fallback chain for a locale.

    Priority:
    1. Custom chain from tenant config (if defined for this locale)
    2. Auto-generated: locale -> strip region -> tenant default

    Example: build_fallback_chain("de-AT", "en") -> ["de-AT", "de", "en"]
    Example: build_fallback_chain("de", "en") -> ["de", "en"]
    Example: build_fallback_chain("en", "en") -> ["en"]
    """
    if custom_chain and locale in custom_chain:
        chain = [locale] + [l for l in custom_chain[locale] if l != locale]
        if tenant_default not in chain:
            chain.append(tenant_default)
        return chain

    chain = [locale]

    # Strip region: de-AT -> de
    if "-" in locale:
        base = locale.split("-")[0]
        if base != locale:
            chain.append(base)

    # Add tenant default as ultimate fallback
    if tenant_default not in chain:
        chain.append(tenant_default)

    return chain


def resolve_locale(
    requested: str | None,
    tenant_locales: list[str],
    tenant_default: str,
    tenant_fallback_chain: dict[str, list[str]] | None = None,
) -> tuple[str, list[str]]:
    """Resolve requested locale to actual locale + fallback chain.

    Returns (resolved_locale, fallback_chain).
    If requested is None or not in tenant_locales, returns tenant_default.
    If tenant_locales is empty (i18n disabled), returns tenant_default.
    """
    if not requested:
        return tenant_default, [tenant_default]

    try:
        requested = validate_locale(requested)
    except ValueError:
        return tenant_default, [tenant_default]

    # If tenant has no locales configured, i18n is effectively disabled
    if not tenant_locales:
        return tenant_default, [tenant_default]

    chain = build_fallback_chain(requested, tenant_default, tenant_fallback_chain)

    # Find first locale in chain that the tenant supports
    for loc in chain:
        if loc in tenant_locales or loc == tenant_default:
            return loc, chain

    return tenant_default, [tenant_default]


def _deep_merge(base: Any, override: Any) -> Any:
    """Deep-merge override into base. Dicts are merged recursively, other types replaced."""
    if isinstance(base, dict) and isinstance(override, dict):
        merged = {**base}
        for key, val in override.items():
            if key in merged:
                merged[key] = _deep_merge(merged[key], val)
            else:
                merged[key] = val
        return merged
    return override


def merge_translation(
    base: dict[str, Any],
    translations: dict[str, dict],
    translatable_fields: set[str],
    locale: str,
    fallback_chain: list[str],
) -> tuple[dict[str, Any], dict[str, str]]:
    """Merge locale-specific translations into base content.

    For each translatable field, walks the fallback chain to find a translation.
    Dicts (seo, hero, data) are deep-merged. Lists and scalars are replaced.
    Sections are always fully replaced (complex nested structure).

    Returns (merged_dict, fallbacks_used).
    fallbacks_used maps field names to the locale they were resolved from.
    Empty dict means all fields came from the requested locale.
    """
    merged = {**base}
    fallbacks_used: dict[str, str] = {}

    for field in translatable_fields:
        if field not in base:
            continue

        # Walk fallback chain to find translation for this field
        resolved_value = None
        resolved_from: str | None = None

        for chain_locale in fallback_chain:
            locale_data = translations.get(chain_locale, {})
            if field in locale_data:
                resolved_value = locale_data[field]
                resolved_from = chain_locale
                break

        if resolved_value is None:
            # No translation found in any fallback — keep base value
            continue

        # Track which fallback was used (only if not the requested locale)
        if resolved_from and resolved_from != locale:
            fallbacks_used[field] = resolved_from

        # Sections: full replacement (structure can differ between locales)
        if field == "sections":
            merged[field] = resolved_value
        # Dicts: deep merge (partial translations possible)
        elif isinstance(base.get(field), dict) and isinstance(resolved_value, dict):
            merged[field] = _deep_merge(base[field], resolved_value)
        # Scalars/lists: direct replacement
        else:
            merged[field] = resolved_value

    return merged, fallbacks_used


def build_locale_metadata(
    requested: str | None,
    resolved: str,
    fallbacks_used: dict[str, str],
) -> dict:
    """Build the _locale response metadata block."""
    return {
        "requested": requested or resolved,
        "resolved": resolved,
        "fallbacks_used": fallbacks_used,
    }


def compute_completeness(
    translations: dict[str, dict],
    translatable_fields: set[str],
    locale: str,
) -> float:
    """Calculate translation completeness (0.0-1.0) for a locale.

    Counts how many translatable fields have non-empty values.
    """
    if not translatable_fields:
        return 1.0

    locale_data = translations.get(locale, {})
    if not locale_data:
        return 0.0

    filled = 0
    for field in translatable_fields:
        val = locale_data.get(field)
        if val is not None and val != "" and val != {} and val != []:
            filled += 1

    return round(filled / len(translatable_fields), 2)


def get_translatable_data_fields(
    schema_fields: list[dict],
) -> set[str]:
    """Extract translatable field names from a collection schema.

    Fields with translatable=False are excluded (numbers, media, relations).
    Default is True for text-like fields.
    """
    non_translatable_types = {"number", "boolean", "media", "media-picker", "relation", "date", "datetime"}
    result = set()
    for f in schema_fields:
        name = f.get("name", "")
        if not name:
            continue
        # Explicit translatable flag takes precedence
        if "translatable" in f:
            if f["translatable"]:
                result.add(name)
            continue
        # Default: translatable unless type is non-translatable
        field_type = f.get("type", "")
        render = f.get("render", "")
        if field_type not in non_translatable_types and render not in non_translatable_types:
            result.add(name)
    return result


def merge_collection_data_translation(
    base_data: dict,
    translations: dict[str, dict],
    translatable_data_fields: set[str],
    locale: str,
    fallback_chain: list[str],
) -> tuple[dict, dict[str, str]]:
    """Merge translations for collection item data fields.

    Only merges fields marked as translatable in the schema.
    Non-translatable fields (price, coordinates) remain unchanged.
    """
    merged = {**base_data}
    fallbacks_used: dict[str, str] = {}

    for field in translatable_data_fields:
        if field not in base_data:
            continue

        resolved_value = None
        resolved_from: str | None = None

        for chain_locale in fallback_chain:
            locale_data = translations.get(chain_locale, {}).get("data", {})
            if field in locale_data:
                resolved_value = locale_data[field]
                resolved_from = chain_locale
                break

        if resolved_value is None:
            continue

        if resolved_from and resolved_from != locale:
            fallbacks_used[f"data.{field}"] = resolved_from

        if isinstance(base_data.get(field), dict) and isinstance(resolved_value, dict):
            merged[field] = _deep_merge(base_data[field], resolved_value)
        else:
            merged[field] = resolved_value

    return merged, fallbacks_used
