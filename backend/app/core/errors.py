"""Bilingual error code system for Contypio CMS."""

ERRORS: dict[str, dict[str, str]] = {
    # Auth
    "auth.invalid_credentials": {
        "en": "Invalid credentials",
        "de": "Ungültige Anmeldedaten",
    },
    "auth.invalid_token": {
        "en": "Invalid token",
        "de": "Ungültiges Token",
    },
    "auth.user_not_found": {
        "en": "User not found or inactive",
        "de": "Benutzer nicht gefunden oder inaktiv",
    },
    "auth.insufficient_permissions": {
        "en": "Insufficient permissions",
        "de": "Unzureichende Berechtigungen",
    },
    "auth.email_taken": {
        "en": "Email already registered",
        "de": "E-Mail bereits vergeben",
    },
    "auth.wrong_password": {
        "en": "Current password is incorrect",
        "de": "Aktuelles Passwort ist falsch",
    },
    # Collections
    "collection.not_found": {
        "en": "Collection not found",
        "de": "Collection nicht gefunden",
    },
    "collection.item_not_found": {
        "en": "Item not found",
        "de": "Eintrag nicht gefunden",
    },
    "collection.key_exists": {
        "en": "Collection key already exists",
        "de": "Collection-Key existiert bereits",
    },
    "collection.delete_confirm": {
        "en": "Collection and all entries permanently deleted",
        "de": "Collection und alle Einträge endgültig gelöscht",
    },
    # Pages
    "page.not_found": {
        "en": "Page not found",
        "de": "Seite nicht gefunden",
    },
    "page.slug_exists": {
        "en": "A page with this slug already exists",
        "de": "Eine Seite mit diesem Slug existiert bereits",
    },
    # Media
    "media.not_found": {
        "en": "Media file not found",
        "de": "Mediendatei nicht gefunden",
    },
    "media.upload_failed": {
        "en": "Upload failed",
        "de": "Upload fehlgeschlagen",
    },
    "media.invalid_type": {
        "en": "Invalid file type",
        "de": "Ungültiger Dateityp",
    },
    # API Keys
    "api_key.not_found": {
        "en": "API key not found",
        "de": "API-Schlüssel nicht gefunden",
    },
    "api_key.invalid": {
        "en": "Invalid API key",
        "de": "Ungültiger API-Schlüssel",
    },
    # Webhooks
    "webhook.not_found": {
        "en": "Webhook not found",
        "de": "Webhook nicht gefunden",
    },
    # Tenant
    "tenant.not_found": {
        "en": "Tenant not found",
        "de": "Tenant nicht gefunden",
    },
    "tenant.slug_taken": {
        "en": "This slug is already taken",
        "de": "Dieser Slug ist bereits vergeben",
    },
    # Limits
    "limit.pages": {
        "en": "Page limit reached for your plan",
        "de": "Seitenlimit für Ihren Plan erreicht",
    },
    "limit.media": {
        "en": "Storage limit reached for your plan",
        "de": "Speicherlimit für Ihren Plan erreicht",
    },
    "limit.users": {
        "en": "User limit reached for your plan",
        "de": "Benutzerlimit für Ihren Plan erreicht",
    },
    # Generic
    "generic.not_found": {
        "en": "Resource not found",
        "de": "Ressource nicht gefunden",
    },
    "generic.validation_error": {
        "en": "Validation error",
        "de": "Validierungsfehler",
    },
    "generic.server_error": {
        "en": "Internal server error",
        "de": "Interner Serverfehler",
    },
    "generic.forbidden": {
        "en": "Access denied",
        "de": "Zugriff verweigert",
    },
    # Import/Export
    "import.failed": {
        "en": "Import failed",
        "de": "Import fehlgeschlagen",
    },
    "import.invalid_format": {
        "en": "Invalid file format",
        "de": "Ungültiges Dateiformat",
    },
    "export.failed": {
        "en": "Export failed",
        "de": "Export fehlgeschlagen",
    },
    # Edition gate
    "edition.feature_not_available": {
        "en": "This feature is not available in your edition",
        "de": "Diese Funktion ist in Ihrer Edition nicht verfügbar",
    },
    "edition.upgrade_required": {
        "en": "Upgrade required for this feature",
        "de": "Upgrade erforderlich für diese Funktion",
    },
}


def get_error(code: str, lang: str = "en") -> str:
    """Get localized error message by code."""
    entry = ERRORS.get(code, {})
    return entry.get(lang, entry.get("en", code))
