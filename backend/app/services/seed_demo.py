"""Demo content seeder — creates sample pages, collections, and globals.

Called on first startup when SEED_DEMO=true.
Idempotent: checks for existing content before creating.
All content in English (international launch).
"""
import logging
import uuid as uuid_mod
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.collection import CmsCollection, CmsCollectionSchema
from app.models.global_config import CmsGlobal
from app.models.page import CmsPage

logger = logging.getLogger("cms.seed")


async def seed_demo_content(tenant_id: uuid_mod.UUID, db: AsyncSession) -> dict:
    """Create demo content for a tenant. Idempotent — skips if content exists."""

    # Check if demo content already exists
    result = await db.execute(
        select(CmsPage).where(CmsPage.tenant_id == tenant_id).limit(1)
    )
    if result.scalar_one_or_none():
        return {"status": "skipped", "reason": "Content already exists"}

    created = {"pages": 0, "collections": 0, "globals": 0}

    # --- Pages ---
    pages = [
        {
            "title": "Homepage",
            "slug": "homepage",
            "path": "/",
            "page_type": "content",
            "status": "published",
            "seo": {"title": "Welcome", "description": "Welcome to our website"},
            "hero": {"h1": "Welcome", "subline": "Build something great"},
            "sections": [
                {
                    "id": "sec_demo01",
                    "layout": "full",
                    "columns": [{"blocks": [
                        {"blockType": "hero", "data": {
                            "headline": "Welcome to Contypio",
                            "subline": "The hybrid headless CMS that combines content modeling with a visual page builder.",
                            "buttonText": "Get Started",
                            "buttonLink": "/about",
                        }},
                    ]}],
                },
                {
                    "id": "sec_demo02",
                    "layout": "thirds",
                    "columns": [
                        {"blocks": [{"blockType": "cards", "data": {
                            "items": [
                                {"title": "Page Builder", "text": "Visual editor with 15+ block types and drag & drop."},
                                {"title": "Collections", "text": "Dynamic data schemas with 16 field types — no code needed."},
                                {"title": "Delivery API", "text": "REST API with filtering, sorting, pagination."},
                            ],
                        }}]},
                    ],
                },
                {
                    "id": "sec_demo03",
                    "layout": "full",
                    "columns": [{"blocks": [
                        {"blockType": "cta", "data": {
                            "heading": "Ready to get started?",
                            "text": "Create your first page in minutes.",
                            "buttonText": "Contact Us",
                            "buttonLink": "/contact",
                        }},
                    ]}],
                },
            ],
            "sort_order": 0,
            "published_at": datetime.now(timezone.utc),
        },
        {
            "title": "About",
            "slug": "about",
            "path": "/about",
            "page_type": "content",
            "status": "published",
            "seo": {"title": "About Us", "description": "Learn more about our company"},
            "sections": [
                {
                    "id": "sec_demo04",
                    "layout": "full",
                    "columns": [{"blocks": [
                        {"blockType": "richText", "data": {
                            "content": "<h2>About Us</h2><p>We build modern tools for content creators and developers. Our CMS combines the flexibility of headless architecture with the ease of a visual page builder.</p><p>Founded in 2026, we believe that managing content should be simple, fast, and enjoyable.</p>",
                        }},
                    ]}],
                },
            ],
            "sort_order": 1,
            "published_at": datetime.now(timezone.utc),
        },
        {
            "title": "Blog",
            "slug": "blog",
            "path": "/blog",
            "page_type": "listing",
            "status": "published",
            "collection_key": "blog-posts",
            "seo": {"title": "Blog", "description": "Latest articles and updates"},
            "sections": [],
            "sort_order": 2,
            "published_at": datetime.now(timezone.utc),
        },
        {
            "title": "Contact",
            "slug": "contact",
            "path": "/contact",
            "page_type": "content",
            "status": "published",
            "seo": {"title": "Contact", "description": "Get in touch"},
            "sections": [
                {
                    "id": "sec_demo05",
                    "layout": "full",
                    "columns": [{"blocks": [
                        {"blockType": "richText", "data": {
                            "content": "<h2>Contact Us</h2><p>We'd love to hear from you. Reach out via email or visit us at our office.</p><p><strong>Email:</strong> hello@example.com</p>",
                        }},
                        {"blockType": "cta", "data": {
                            "heading": "Send us a message",
                            "text": "We typically respond within 24 hours.",
                            "buttonText": "Email Us",
                            "buttonLink": "mailto:hello@example.com",
                        }},
                    ]}],
                },
            ],
            "sort_order": 3,
            "published_at": datetime.now(timezone.utc),
        },
    ]

    for page_data in pages:
        page = CmsPage(tenant_id=tenant_id, **page_data)
        db.add(page)
        created["pages"] += 1

    # --- Blog Collection Schema ---
    result = await db.execute(
        select(CmsCollectionSchema).where(
            CmsCollectionSchema.tenant_id == tenant_id,
            CmsCollectionSchema.collection_key == "blog-posts",
        )
    )
    if not result.scalar_one_or_none():
        schema = CmsCollectionSchema(
            tenant_id=tenant_id,
            collection_key="blog-posts",
            label="Blog Posts",
            label_singular="Blog Post",
            icon="FileText",
            title_field="title",
            slug_field="slug",
            sort_field="sort_order",
            fields=[
                {"name": "excerpt", "label": "Excerpt", "type": "textarea", "required": True},
                {"name": "content", "label": "Content", "type": "richtext", "required": True},
                {"name": "author", "label": "Author", "type": "input"},
                {"name": "date", "label": "Date", "type": "date"},
            ],
        )
        db.add(schema)

    # --- Blog Posts ---
    blog_posts = [
        {
            "title": "Getting Started with Contypio",
            "slug": "getting-started",
            "data": {
                "excerpt": "Learn how to set up your first Contypio project in minutes.",
                "content": "<p>Contypio makes it easy to create and manage content. Start by creating a page, add sections and blocks, and publish.</p>",
                "author": "Admin",
                "date": "2026-03-15",
            },
            "sort_order": 0,
        },
        {
            "title": "Understanding Collections",
            "slug": "understanding-collections",
            "data": {
                "excerpt": "Collections are structured data schemas that power dynamic content.",
                "content": "<p>Think of collections as flexible database tables you can create from the UI. Define fields, add items, and query them via the API.</p>",
                "author": "Admin",
                "date": "2026-03-14",
            },
            "sort_order": 1,
        },
        {
            "title": "Building with the Delivery API",
            "slug": "delivery-api",
            "data": {
                "excerpt": "How to fetch content from any frontend framework using the REST API.",
                "content": "<p>The Delivery API serves published content via standard REST endpoints. It supports filtering, sorting, pagination, and locale parameters.</p>",
                "author": "Admin",
                "date": "2026-03-13",
            },
            "sort_order": 2,
        },
    ]

    for post_data in blog_posts:
        post = CmsCollection(
            tenant_id=tenant_id,
            collection_key="blog-posts",
            status="published",
            **post_data,
        )
        db.add(post)
        created["collections"] += 1

    # --- Globals ---
    globals_data = [
        {
            "slug": "site-settings",
            "label": "Site Settings",
            "data": {"site_name": "Demo Website", "tagline": "Built with Contypio", "contact_email": "hello@example.com"},
        },
        {
            "slug": "navigation",
            "label": "Navigation",
            "data": {
                "main_menu": [
                    {"label": "Home", "href": "/"},
                    {"label": "About", "href": "/about"},
                    {"label": "Blog", "href": "/blog"},
                    {"label": "Contact", "href": "/contact"},
                ],
                "footer_links": [
                    {"label": "Privacy Policy", "href": "/privacy"},
                    {"label": "Terms of Service", "href": "/terms"},
                ],
            },
        },
        {
            "slug": "social-media",
            "label": "Social Media",
            "data": {"twitter": "", "github": "", "linkedin": ""},
        },
    ]

    for global_data in globals_data:
        # Check if global already exists (might be seeded by onboarding)
        existing = await db.execute(
            select(CmsGlobal).where(
                CmsGlobal.tenant_id == tenant_id,
                CmsGlobal.slug == global_data["slug"],
            )
        )
        if not existing.scalar_one_or_none():
            g = CmsGlobal(tenant_id=tenant_id, **global_data)
            db.add(g)
            created["globals"] += 1

    await db.commit()
    logger.info("Demo content created: %s", created)
    return {"status": "created", **created}
