-- Contypio CMS — ICU Collations
-- Runs automatically on first DB init (mounted into /docker-entrypoint-initdb.d/)
-- Provides locale-aware sorting for international content.

-- German (Umlaute: ä→a, ö→o, ü→u in sort order)
CREATE COLLATION IF NOT EXISTS "de-DE" (
    provider = icu, locale = 'de-DE', deterministic = false
);

-- English
CREATE COLLATION IF NOT EXISTS "en-US" (
    provider = icu, locale = 'en-US', deterministic = false
);

-- French
CREATE COLLATION IF NOT EXISTS "fr-FR" (
    provider = icu, locale = 'fr-FR', deterministic = false
);

-- Spanish
CREATE COLLATION IF NOT EXISTS "es-ES" (
    provider = icu, locale = 'es-ES', deterministic = false
);

-- Turkish (important: I/İ distinction)
CREATE COLLATION IF NOT EXISTS "tr-TR" (
    provider = icu, locale = 'tr-TR', deterministic = false
);
