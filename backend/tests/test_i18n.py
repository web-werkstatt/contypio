"""Tests for content i18n (S1 Phase 1).

Tests locale validation, fallback chains, translation merging,
completeness calculation, and BOPLA field stripping.
"""
import pytest

from app.core.content_i18n import (
    validate_locale,
    build_fallback_chain,
    resolve_locale,
    merge_translation,
    build_locale_metadata,
    compute_completeness,
    PAGE_TRANSLATABLE_FIELDS,
)
from app.delivery.query_params import strip_internal_fields


# --- Locale Validation ---

class TestValidateLocale:
    def test_valid_language(self):
        assert validate_locale("de") == "de"

    def test_valid_language_region(self):
        assert validate_locale("de-AT") == "de-AT"

    def test_invalid_format(self):
        with pytest.raises(ValueError):
            validate_locale("deutsch")

    def test_empty_string(self):
        with pytest.raises(ValueError):
            validate_locale("")

    def test_strips_whitespace(self):
        assert validate_locale(" en ") == "en"


# --- Fallback Chain ---

class TestBuildFallbackChain:
    def test_simple_language(self):
        chain = build_fallback_chain("de", "en")
        assert chain == ["de", "en"]

    def test_region_strips_to_base(self):
        chain = build_fallback_chain("de-AT", "en")
        assert chain == ["de-AT", "de", "en"]

    def test_default_not_duplicated(self):
        chain = build_fallback_chain("en", "en")
        assert chain == ["en"]

    def test_custom_chain(self):
        chain = build_fallback_chain("de-AT", "en", {"de-AT": ["de", "fr"]})
        assert chain == ["de-AT", "de", "fr", "en"]

    def test_custom_chain_with_default_included(self):
        chain = build_fallback_chain("fr", "en", {"fr": ["en"]})
        assert chain == ["fr", "en"]


# --- Resolve Locale ---

class TestResolveLocale:
    def test_none_returns_default(self):
        resolved, chain = resolve_locale(None, ["en", "de"], "en")
        assert resolved == "en"
        assert chain == ["en"]

    def test_valid_locale(self):
        resolved, chain = resolve_locale("de", ["en", "de"], "en")
        assert resolved == "de"

    def test_empty_locales_returns_default(self):
        resolved, chain = resolve_locale("de", [], "en")
        assert resolved == "en"

    def test_invalid_locale_returns_default(self):
        resolved, chain = resolve_locale("invalid!", ["en", "de"], "en")
        assert resolved == "en"


# --- Merge Translation ---

class TestMergeTranslation:
    def test_no_translations(self):
        base = {"title": "Home", "seo": {"title": "Welcome"}}
        merged, fallbacks = merge_translation(base, {}, {"title", "seo"}, "de", ["de", "en"])
        assert merged == base
        assert fallbacks == {}

    def test_simple_field_override(self):
        base = {"title": "Home", "slug": "home"}
        translations = {"de": {"title": "Startseite"}}
        merged, fallbacks = merge_translation(base, translations, {"title"}, "de", ["de", "en"])
        assert merged["title"] == "Startseite"
        assert merged["slug"] == "home"  # not translatable
        assert fallbacks == {}

    def test_deep_merge_dict(self):
        base = {"seo": {"title": "Welcome", "description": "Hello"}}
        translations = {"de": {"seo": {"title": "Willkommen"}}}
        merged, fallbacks = merge_translation(base, translations, {"seo"}, "de", ["de", "en"])
        assert merged["seo"]["title"] == "Willkommen"
        assert merged["seo"]["description"] == "Hello"  # kept from base

    def test_fallback_tracking(self):
        base = {"title": "Home", "seo": {"title": "Welcome"}}
        translations = {"en": {"title": "Home EN"}}
        merged, fallbacks = merge_translation(base, translations, {"title"}, "de", ["de", "en"])
        assert merged["title"] == "Home EN"
        assert fallbacks == {"title": "en"}

    def test_sections_full_replace(self):
        base = {"sections": [{"id": "a"}]}
        translations = {"de": {"sections": [{"id": "b"}, {"id": "c"}]}}
        merged, _ = merge_translation(base, translations, {"sections"}, "de", ["de"])
        assert len(merged["sections"]) == 2


# --- Completeness ---

class TestCompleteness:
    def test_empty_translations(self):
        assert compute_completeness({}, {"title", "seo"}, "de") == 0.0

    def test_full_translation(self):
        translations = {"de": {"title": "Hallo", "seo": {"title": "X"}, "hero": {"h1": "Y"}, "sections": [{"id": "s1"}]}}
        assert compute_completeness(translations, PAGE_TRANSLATABLE_FIELDS, "de") == 1.0

    def test_partial_translation(self):
        translations = {"de": {"title": "Hallo"}}
        score = compute_completeness(translations, PAGE_TRANSLATABLE_FIELDS, "de")
        assert 0.0 < score < 1.0

    def test_no_fields(self):
        assert compute_completeness({}, set(), "de") == 1.0


# --- Locale Metadata ---

class TestLocaleMetadata:
    def test_basic_metadata(self):
        meta = build_locale_metadata("de-AT", "de", {"seo": "en"})
        assert meta["requested"] == "de-AT"
        assert meta["resolved"] == "de"
        assert meta["fallbacks_used"] == {"seo": "en"}

    def test_none_requested(self):
        meta = build_locale_metadata(None, "en", {})
        assert meta["requested"] == "en"


# --- BOPLA Field Stripping ---

class TestStripInternalFields:
    def test_strips_tenant_id(self):
        data = {"id": 1, "title": "Test", "tenant_id": "abc-123"}
        result = strip_internal_fields(data)
        assert "tenant_id" not in result
        assert result["title"] == "Test"

    def test_strips_multiple_fields(self):
        data = {"id": 1, "created_by": "user", "updated_by": "user", "hashed_password": "x"}
        result = strip_internal_fields(data)
        assert "created_by" not in result
        assert "updated_by" not in result
        assert "hashed_password" not in result
        assert result["id"] == 1

    def test_keeps_normal_fields(self):
        data = {"title": "Test", "slug": "test", "data": {"key": "value"}}
        result = strip_internal_fields(data)
        assert result == data
