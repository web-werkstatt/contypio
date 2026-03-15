"""Module Registry: Zwei-Ebenen-Gating fuer CMS-Features.

Ebene 1 (Edition): Definiert VERFUEGBARE Module (hardcoded).
Ebene 2 (Tenant): Waehlt AKTIVE Module (gespeichert in tenant.settings["active_modules"]).
Default: Ohne Konfiguration = alle editions-erlaubten Module aktiv.
"""
from dataclasses import dataclass, field

from app.models.tenant import CmsTenant


EDITION_ORDER = ["light", "starter", "pro", "agency"]


@dataclass(frozen=True)
class ModuleDefinition:
    key: str
    label: str
    description: str
    min_edition: str
    category: str
    depends_on: tuple[str, ...] = field(default=())
    icon: str = "Box"


# --- Module Definitions ---

MODULE_REGISTRY: dict[str, ModuleDefinition] = {}


def _register(*modules: ModuleDefinition) -> None:
    for m in modules:
        MODULE_REGISTRY[m.key] = m


_register(
    # Content
    ModuleDefinition("pages", "Seiten", "Seiten erstellen und verwalten", "light", "content", icon="FileText"),
    ModuleDefinition("collections", "Collections", "Strukturierte Datensammlungen", "light", "content", icon="Database"),
    ModuleDefinition("media", "Medien", "Bilder und Dateien verwalten", "light", "content", icon="Image"),
    # Marketing
    ModuleDefinition("blog", "Blog", "Blog-Beitraege veroeffentlichen", "starter", "marketing", ("pages",), icon="PenLine"),
    ModuleDefinition("forms", "Formulare", "Kontakt- und Anfrageformulare", "starter", "marketing", ("pages",), icon="FileInput"),
    ModuleDefinition("seo", "SEO-Werkzeuge", "Suchmaschinenoptimierung", "starter", "marketing", ("pages",), icon="Search"),
    # System
    ModuleDefinition("globals", "Einstellungen", "Globale Konfigurationen", "light", "system", icon="Settings"),
    ModuleDefinition("import_export", "Import/Export", "Daten importieren und exportieren", "light", "system", icon="Download"),
    ModuleDefinition("webhooks", "Webhooks", "Externe Systeme benachrichtigen", "light", "system", icon="Webhook"),
    ModuleDefinition("analytics", "Analytics", "Nutzungsstatistiken", "starter", "system", icon="BarChart3"),
    ModuleDefinition("api_keys", "API Keys", "Programmatischer API-Zugang", "pro", "system", icon="Key"),
    ModuleDefinition("staging", "Staging", "Staging-Umgebung", "pro", "system", icon="GitBranch"),
    ModuleDefinition(
        "content_templates", "Content Templates",
        "Content-Vorlagen und Textqualitäts-Analyse mit KI-Bewertung",
        "starter", "marketing", icon="PenTool",
    ),
    # Blocks
    ModuleDefinition(
        "advanced_blocks", "Erweiterte Blöcke",
        "Video, Karte, Formular, Tabs, Tabelle, Testimonials, Team, Logo-Slider, Zähler, Social Links",
        "starter", "content", icon="LayoutGrid",
    ),
)

CATEGORY_LABELS = {
    "content": "Inhalte",
    "marketing": "Marketing",
    "system": "System",
}

CATEGORY_ORDER = ["content", "marketing", "system"]


def _edition_rank(edition: str) -> int:
    try:
        return EDITION_ORDER.index(edition)
    except ValueError:
        return 0


def get_available_modules(edition: str) -> list[ModuleDefinition]:
    """Module die fuer eine Edition VERFUEGBAR sind."""
    rank = _edition_rank(edition)
    return [m for m in MODULE_REGISTRY.values() if _edition_rank(m.min_edition) <= rank]


def get_available_module_keys(edition: str) -> set[str]:
    return {m.key for m in get_available_modules(edition)}


def get_active_modules(tenant: CmsTenant) -> set[str]:
    """Aktive Module eines Tenants. Default: alle verfuegbaren."""
    available = get_available_module_keys(tenant.edition)
    configured = tenant.settings.get("active_modules") if tenant.settings else None
    if configured is None:
        return available
    return set(configured) & available


def is_module_active(tenant: CmsTenant, key: str) -> bool:
    return key in get_active_modules(tenant)


def validate_module_activation(
    edition: str, keys: list[str]
) -> tuple[bool, str | None]:
    """Prueft ob Module aktiviert werden koennen. Gibt (ok, error) zurueck."""
    available = get_available_module_keys(edition)

    for key in keys:
        if key not in MODULE_REGISTRY:
            return False, f"Unbekanntes Modul: {key}"
        if key not in available:
            mod = MODULE_REGISTRY[key]
            return False, (
                f"Modul '{mod.label}' erfordert mindestens die "
                f"{mod.min_edition}-Edition (aktuell: {edition})."
            )

    active_set = set(keys)
    for key in keys:
        mod = MODULE_REGISTRY[key]
        for dep in mod.depends_on:
            if dep not in active_set:
                dep_mod = MODULE_REGISTRY[dep]
                return False, (
                    f"Modul '{mod.label}' benoetigt '{dep_mod.label}' als Voraussetzung."
                )

    return True, None


def get_modules_response(tenant: CmsTenant) -> list[dict]:
    """Vollstaendige Modul-Liste fuer Frontend."""
    available_keys = get_available_module_keys(tenant.edition)
    active_keys = get_active_modules(tenant)

    result = []
    for mod in MODULE_REGISTRY.values():
        result.append({
            "key": mod.key,
            "label": mod.label,
            "description": mod.description,
            "category": mod.category,
            "category_label": CATEGORY_LABELS.get(mod.category, mod.category),
            "icon": mod.icon,
            "min_edition": mod.min_edition,
            "depends_on": list(mod.depends_on),
            "available": mod.key in available_keys,
            "active": mod.key in active_keys,
        })
    return result
