"""Base importer interface and data models for CMS import/migration."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class FieldInfo:
    name: str
    label: str
    type: str = "text"
    required: bool = False
    placeholder: str = ""


@dataclass
class GlobalInfo:
    key: str
    label: str
    field_count: int = 0


@dataclass
class CollectionInfo:
    key: str
    label: str
    count: int = 0
    fields: list[str] = field(default_factory=list)


@dataclass
class PageInfo:
    count: int = 0
    has_tree: bool = False


@dataclass
class MediaInfo:
    count: int = 0
    total_size_bytes: int = 0


@dataclass
class ImportManifest:
    """What the source system has - result of discover()."""
    globals: list[GlobalInfo] = field(default_factory=list)
    collections: list[CollectionInfo] = field(default_factory=list)
    pages: PageInfo = field(default_factory=PageInfo)
    media: MediaInfo = field(default_factory=MediaInfo)


@dataclass
class ImportMapping:
    """What to import - user selection."""
    globals: list[str] = field(default_factory=list)
    collections: list[str] = field(default_factory=list)
    import_pages: bool = False
    import_media: bool = False
    conflict: str = "skip"  # skip | overwrite | merge


@dataclass
class ImportResult:
    """Result of an import operation."""
    globals_created: int = 0
    globals_updated: int = 0
    pages_created: int = 0
    pages_updated: int = 0
    collections_created: int = 0
    items_created: int = 0
    items_updated: int = 0
    media_uploaded: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def success(self) -> bool:
        return len(self.errors) == 0

    @property
    def total_imported(self) -> int:
        return (self.globals_created + self.globals_updated +
                self.pages_created + self.items_created +
                self.items_updated + self.media_uploaded)

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "globals_created": self.globals_created,
            "globals_updated": self.globals_updated,
            "pages_created": self.pages_created,
            "pages_updated": self.pages_updated,
            "collections_created": self.collections_created,
            "items_created": self.items_created,
            "items_updated": self.items_updated,
            "media_uploaded": self.media_uploaded,
            "total_imported": self.total_imported,
            "errors": self.errors,
            "warnings": self.warnings,
        }


ProgressCallback = Callable[[str, int, int], None]  # (message, current, total)


class BaseImporter(ABC):
    """Abstract base for all CMS importers."""

    name: str = "Unknown"
    slug: str = "unknown"
    description: str = ""
    config_fields: list[FieldInfo] = []

    @abstractmethod
    async def test_connection(self, config: dict) -> tuple[bool, str]:
        """Test if the source is reachable. Returns (success, message)."""

    @abstractmethod
    async def discover(self, config: dict) -> ImportManifest:
        """Analyze the source and return what's available for import."""

    @abstractmethod
    async def import_data(
        self,
        config: dict,
        mapping: ImportMapping,
        tenant_id: UUID,
        db: AsyncSession,
        on_progress: ProgressCallback | None = None,
    ) -> ImportResult:
        """Execute the import. Must be idempotent."""

    def info(self) -> dict:
        return {
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "config_fields": [
                {"name": f.name, "label": f.label, "type": f.type,
                 "required": f.required, "placeholder": f.placeholder}
                for f in self.config_fields
            ],
        }
