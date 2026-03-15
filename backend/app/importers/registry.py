"""Importer registry - auto-discovers and registers all importers."""

from app.importers.base import BaseImporter

_IMPORTERS: dict[str, type[BaseImporter]] = {}


def register(cls: type[BaseImporter]) -> type[BaseImporter]:
    """Decorator to register an importer class."""
    _IMPORTERS[cls.slug] = cls
    return cls


def get_importer(slug: str) -> BaseImporter:
    """Get an importer instance by slug."""
    cls = _IMPORTERS.get(slug)
    if not cls:
        raise ValueError(f"Unknown importer: {slug}")
    return cls()


def list_importers() -> list[dict]:
    """List all registered importers with their config."""
    return [cls().info() for cls in _IMPORTERS.values()]


def load_all():
    """Import all importer modules to trigger registration."""
    from app.importers import payload  # noqa: F401
    from app.importers import json_file  # noqa: F401
