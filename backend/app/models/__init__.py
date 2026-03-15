from app.models.base import Base
from app.models.tenant import CmsTenant

__all__ = ["Base", "CmsTenant"]


def import_all_models():
    """Import all models so Alembic/metadata.create_all can find them."""
    from app.auth.models import CmsUser  # noqa: F401
    from app.models.collection import CmsCollection, CmsCollectionSchema  # noqa: F401
    from app.models.field_type import CmsFieldTypePreset  # noqa: F401
    from app.models.global_config import CmsGlobal  # noqa: F401
    from app.models.media import CmsMedia  # noqa: F401
    from app.models.media_folder import CmsMediaFolder  # noqa: F401
    from app.models.page import CmsPage  # noqa: F401
    from app.models.page_version import CmsPageVersion  # noqa: F401
    from app.models.pricing import PricingPlan  # noqa: F401
    from app.models.content_template import CmsContentTemplate  # noqa: F401
    from app.models.webhook import CmsWebhook, CmsWebhookLog  # noqa: F401
