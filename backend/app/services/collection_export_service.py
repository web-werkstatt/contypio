"""CSV/JSON Export Service für Collections."""
import csv
import io
import json

from app.models.collection import CmsCollection, CmsCollectionSchema


def export_csv(items: list[CmsCollection], schema: CmsCollectionSchema) -> str:
    """Items als CSV exportieren. Titel + alle Schema-Felder als Spalten."""
    field_names = [f["name"] for f in schema.fields]
    columns = ["title", "slug", "status"] + field_names

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()

    for item in items:
        row: dict[str, str] = {
            "title": item.title,
            "slug": item.slug or "",
            "status": item.status,
        }
        for name in field_names:
            val = item.data.get(name, "")
            if isinstance(val, (list, dict)):
                row[name] = json.dumps(val, ensure_ascii=False)
            else:
                row[name] = str(val) if val is not None else ""
        writer.writerow(row)

    return output.getvalue()


def export_json(items: list[CmsCollection], schema: CmsCollectionSchema) -> str:
    """Items als JSON-Array exportieren."""
    field_names = [f["name"] for f in schema.fields]
    result = []

    for item in items:
        obj: dict = {
            "title": item.title,
            "slug": item.slug,
            "status": item.status,
        }
        for name in field_names:
            obj[name] = item.data.get(name)
        result.append(obj)

    return json.dumps(result, ensure_ascii=False, indent=2)
