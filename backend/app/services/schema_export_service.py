"""Schema export/import as YAML or JSON."""

import json

import yaml

from app.models.collection import CmsCollectionSchema


def _schema_to_dict(schema: CmsCollectionSchema) -> dict:
    """Convert a CmsCollectionSchema to a clean dict (no IDs, no timestamps)."""
    fields_clean = []
    for f in (schema.fields or []):
        field = {k: v for k, v in f.items() if v not in (None, "", [], {})}
        # Remove internal render/config if they match the type defaults
        fields_clean.append(field)

    return {
        "collection_key": schema.collection_key,
        "label": schema.label,
        "label_singular": schema.label_singular,
        "icon": schema.icon,
        "title_field": schema.title_field,
        "slug_field": schema.slug_field,
        "sort_field": schema.sort_field,
        "fields": fields_clean,
    }


def export_schema_yaml(schema: CmsCollectionSchema) -> str:
    """Export schema as YAML string."""
    data = _schema_to_dict(schema)
    return yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)


def export_schema_json(schema: CmsCollectionSchema) -> str:
    """Export schema as JSON string."""
    data = _schema_to_dict(schema)
    return json.dumps(data, indent=2, ensure_ascii=False)


def parse_schema_file(content: bytes, filename: str) -> dict:
    """Parse uploaded schema file (YAML or JSON) and return dict.

    Raises ValueError on parse errors or missing required fields.
    """
    text = content.decode("utf-8")

    if filename.endswith((".yml", ".yaml")):
        try:
            data = yaml.safe_load(text)
        except yaml.YAMLError as e:
            raise ValueError(f"Ungültiges YAML: {e}")
    elif filename.endswith(".json"):
        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültiges JSON: {e}")
    else:
        raise ValueError("Nur .yaml, .yml und .json Dateien werden unterstützt")

    if not isinstance(data, dict):
        raise ValueError("Schema muss ein Objekt sein")

    required = ["collection_key", "label", "label_singular"]
    for key in required:
        if not data.get(key):
            raise ValueError(f"Pflichtfeld fehlt: {key}")

    if not isinstance(data.get("fields", []), list):
        raise ValueError("'fields' muss eine Liste sein")

    return data
