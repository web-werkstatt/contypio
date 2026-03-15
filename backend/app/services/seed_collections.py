import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.collection import CmsCollectionSchema
from app.models.field_type import CmsFieldTypePreset
from app.models.global_config import CmsGlobal

logger = logging.getLogger("cms")

COLLECTION_SCHEMAS = [
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
            {"name": "seo_title", "type": "text", "label": "SEO Titel"},
            {"name": "seo_description", "type": "textarea", "label": "SEO Beschreibung"},
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
            {"name": "api_filter", "type": "text", "label": "API Filter"},
            {"name": "image", "type": "media", "label": "Bild"},
            {"name": "beschreibung", "type": "richtext", "label": "Beschreibung"},
            {"name": "seo_title", "type": "text", "label": "SEO Titel"},
            {"name": "seo_description", "type": "textarea", "label": "SEO Beschreibung"},
        ],
    },
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
            {"name": "telefon", "type": "text", "label": "Telefon"},
            {"name": "email", "type": "email", "label": "E-Mail"},
            {"name": "bio", "type": "richtext", "label": "Biografie"},
        ],
    },
    {
        "collection_key": "megamenu-bilder",
        "label": "Megamenu-Bilder",
        "label_singular": "Megamenu-Bild",
        "icon": "Image",
        "title_field": "kontinent",
        "slug_field": None,
        "sort_field": "sort_order",
        "fields": [
            {"name": "kontinent", "type": "select", "label": "Kontinent", "required": True, "options": ["Europa", "Asien", "Afrika", "Nordamerika", "Suedamerika", "Ozeanien"]},
            {"name": "bild", "type": "media", "label": "Bild", "required": True},
            {"name": "reiseziel", "type": "relation", "render": "relation", "label": "Reiseziel", "config": {"collection": "destinations", "display_field": "title", "multiple": False}},
        ],
    },
]

def _build_globals_seed() -> list[dict]:
    from app.core.config import settings
    return [
        {
            "slug": "site-settings",
            "label": "Site Settings",
            "data": {
                "site_name": settings.DEFAULT_SITE_NAME,
                "tagline": settings.DEFAULT_SITE_TAGLINE,
                "contact_email": settings.DEFAULT_ADMIN_EMAIL,
                "contact_phone": "",
                "address": "",
                "logo_id": None,
            },
        },
        {
            "slug": "navigation",
            "label": "Navigation",
            "data": {
                "main_menu": [
                    {"label": "Startseite", "href": "/", "children": []},
                    {"label": "Ueber uns", "href": "/ueber-uns", "children": []},
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
            "data": {
                "instagram": "",
                "facebook": "",
                "youtube": "",
                "tiktok": "",
            },
        },
    ]


FIELD_TYPE_PRESETS = [
    {"type_key": "text", "label": "Text", "category": "basic", "render": "input", "config": {"inputType": "text"}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 1},
    {"type_key": "email", "label": "E-Mail", "category": "basic", "render": "input", "config": {"inputType": "email"}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 2},
    {"type_key": "phone", "label": "Telefon", "category": "basic", "render": "input", "config": {"inputType": "tel", "pattern": "^[0-9+ ()-]+$", "placeholder": "+49..."}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 3},
    {"type_key": "url", "label": "URL", "category": "basic", "render": "input", "config": {"inputType": "url"}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 4},
    {"type_key": "number", "label": "Zahl", "category": "basic", "render": "input", "config": {"inputType": "number"}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 5},
    {"type_key": "date", "label": "Datum", "category": "basic", "render": "input", "config": {"inputType": "date"}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 6},
    {"type_key": "textarea", "label": "Textarea", "category": "basic", "render": "textarea", "config": {"rows": 3}, "has_options": False, "has_sub_fields": False, "list_visible": False, "sort_order": 7},
    {"type_key": "richtext", "label": "Rich Text", "category": "advanced", "render": "textarea", "config": {"rows": 5, "monospace": True, "placeholder": "HTML/Markdown"}, "has_options": False, "has_sub_fields": False, "list_visible": False, "sort_order": 8},
    {"type_key": "select", "label": "Auswahl", "category": "basic", "render": "select", "config": {}, "has_options": True, "has_sub_fields": False, "list_visible": True, "sort_order": 9},
    {"type_key": "toggle", "label": "Toggle", "category": "basic", "render": "checkbox", "config": {}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 10},
    {"type_key": "boolean", "label": "Boolean", "category": "basic", "render": "checkbox", "config": {}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 11},
    {"type_key": "color", "label": "Farbe", "category": "advanced", "render": "color", "config": {}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 12},
    {"type_key": "media", "label": "Media (ID)", "category": "advanced", "render": "input", "config": {"inputType": "number", "placeholder": "Media ID"}, "has_options": False, "has_sub_fields": False, "list_visible": False, "sort_order": 13},
    {"type_key": "media-picker", "label": "Media-Picker", "category": "advanced", "render": "media-picker", "config": {}, "has_options": False, "has_sub_fields": False, "list_visible": False, "sort_order": 14},
    {"type_key": "group", "label": "Gruppe", "category": "advanced", "render": "group", "config": {}, "has_options": False, "has_sub_fields": True, "list_visible": False, "sort_order": 15},
    {"type_key": "repeater", "label": "Repeater", "category": "advanced", "render": "repeater", "config": {}, "has_options": False, "has_sub_fields": True, "list_visible": False, "sort_order": 16},
    {"type_key": "relation", "label": "Relation", "category": "advanced", "render": "relation", "config": {"collection": "", "display_field": "title", "multiple": False}, "has_options": False, "has_sub_fields": False, "list_visible": True, "sort_order": 17},
]

# Mapping: type -> (render, config) for migrating legacy FieldDefs
TYPE_TO_RENDER: dict[str, tuple[str, dict]] = {p["type_key"]: (p["render"], p["config"]) for p in FIELD_TYPE_PRESETS}


async def seed_field_type_presets(tenant_id: uuid.UUID, db: AsyncSession) -> None:
    for preset_data in FIELD_TYPE_PRESETS:
        result = await db.execute(
            select(CmsFieldTypePreset).where(
                CmsFieldTypePreset.tenant_id == tenant_id,
                CmsFieldTypePreset.type_key == preset_data["type_key"],
            )
        )
        if not result.scalar_one_or_none():
            obj = CmsFieldTypePreset(tenant_id=tenant_id, **preset_data)
            db.add(obj)
            logger.info("Seeded field type preset: %s", preset_data["type_key"])
    await db.commit()


async def seed_collections_and_globals(tenant_id: uuid.UUID, db: AsyncSession) -> None:
    for schema_data in COLLECTION_SCHEMAS:
        result = await db.execute(
            select(CmsCollectionSchema).where(
                CmsCollectionSchema.tenant_id == tenant_id,
                CmsCollectionSchema.collection_key == schema_data["collection_key"],
            )
        )
        if not result.scalar_one_or_none():
            obj = CmsCollectionSchema(tenant_id=tenant_id, **schema_data)
            db.add(obj)
            logger.info("Seeded collection schema: %s", schema_data["collection_key"])

    for global_data in _build_globals_seed():
        result = await db.execute(
            select(CmsGlobal).where(
                CmsGlobal.tenant_id == tenant_id,
                CmsGlobal.slug == global_data["slug"],
            )
        )
        if not result.scalar_one_or_none():
            obj = CmsGlobal(tenant_id=tenant_id, **global_data)
            db.add(obj)
            logger.info("Seeded global: %s", global_data["slug"])

    await db.commit()
