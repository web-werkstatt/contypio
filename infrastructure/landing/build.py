#!/usr/bin/env python3
"""Landing Page Generator — builds index.html from repo data.

Reads sprint status, SDK version, and feature counts from the repo
and generates a static HTML landing page.

Usage:
    python3 infrastructure/landing/build.py
    # or via deploy script:
    ./infrastructure/deploy/deploy.sh sync landing
"""

import json
import re
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SPRINTS_DIR = PROJECT_ROOT / "sessions" / "sprints"
SDK_PACKAGE = PROJECT_ROOT / "packages" / "contypio-client" / "package.json"
TEMPLATE_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "index.html"


def count_sprints() -> dict:
    """Count sprint statuses from sprint .md files."""
    done = 0
    active = 0
    planned = 0

    for f in sorted(SPRINTS_DIR.glob("SPRINT_*.md")):
        content = f.read_text(encoding="utf-8")
        status_match = re.search(r"\*\*Status:\*\*\s*(.+)", content)
        if not status_match:
            continue
        status = status_match.group(1).strip().upper()
        if "DONE" in status or "FERTIG" in status:
            done += 1
        elif "ARBEIT" in status or "PROGRESS" in status or "AKTIV" in status:
            active += 1
        else:
            planned += 1

    # Add the 25 historical sprints (L1-L28, VE, G1-G2) not tracked as files
    done += 25

    return {"done": done, "active": active, "planned": planned, "total": done + active + planned}


def get_sdk_version() -> str:
    """Read SDK version from package.json."""
    try:
        data = json.loads(SDK_PACKAGE.read_text(encoding="utf-8"))
        return data.get("version", "0.0.0")
    except (FileNotFoundError, json.JSONDecodeError):
        return "0.0.0"


def get_sprint_details() -> list[dict]:
    """Extract sprint names, status, and descriptions from .md files."""
    sprints = []
    for f in sorted(SPRINTS_DIR.glob("SPRINT_*.md")):
        content = f.read_text(encoding="utf-8")

        # Extract title from first H1
        title_match = re.search(r"^#\s+(.+)", content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else f.stem

        # Extract status
        status_match = re.search(r"\*\*Status:\*\*\s*(.+)", content)
        status_raw = status_match.group(1).strip() if status_match else "GEPLANT"

        if "DONE" in status_raw.upper() or "FERTIG" in status_raw.upper():
            status = "done"
        elif "ARBEIT" in status_raw.upper() or "PROGRESS" in status_raw.upper():
            status = "active"
        else:
            status = "planned"

        sprints.append({"title": title, "status": status, "file": f.name})

    return sprints


def calculate_progress(counts: dict) -> int:
    """Calculate overall progress percentage."""
    total = counts["total"]
    if total == 0:
        return 0
    # Done = 100%, Active = 50% credit, Planned = 0%
    progress = (counts["done"] * 100 + counts["active"] * 50) / total
    return min(99, int(progress))


def build_sprint_rows(sprints: list[dict]) -> str:
    """Generate HTML for sprint task list items."""
    rows = []
    for s in sprints:
        if s["status"] == "done":
            icon = '<div class="task-icon icon-done">&#10003;</div>'
        elif s["status"] == "active":
            icon = '<div class="task-icon icon-progress">&#9679;</div>'
        else:
            icon = '<div class="task-icon icon-planned">&#8226;</div>'

        rows.append(f"""                <li>
                    {icon}
                    <div class="task-label">
                        <strong>{s['title']}</strong>
                    </div>
                </li>""")
    return "\n".join(rows)


def build():
    """Main build function."""
    counts = count_sprints()
    sdk_version = get_sdk_version()
    sprints = get_sprint_details()
    progress = calculate_progress(counts)
    today = date.today().strftime("%-d. %b %Y").replace("Mar", "Mrz").replace("Jan", "Jan").replace("Feb", "Feb")

    template = TEMPLATE_FILE.read_text(encoding="utf-8")

    # Replace placeholders
    html = template.replace("{{DATE}}", today)
    html = html.replace("{{SPRINTS_DONE}}", str(counts["done"]))
    html = html.replace("{{SPRINTS_ACTIVE}}", str(counts["active"]))
    html = html.replace("{{SPRINTS_PLANNED}}", str(counts["planned"]))
    html = html.replace("{{PROGRESS}}", str(progress))
    html = html.replace("{{SDK_VERSION}}", f"v{sdk_version}")
    html = html.replace("{{SPRINT_ROWS}}", build_sprint_rows(sprints))

    OUTPUT_FILE.write_text(html, encoding="utf-8")
    print(f"Built {OUTPUT_FILE} — {progress}%, {counts['done']} done, SDK {sdk_version}")


if __name__ == "__main__":
    build()
