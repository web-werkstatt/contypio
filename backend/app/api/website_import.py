"""
L23: Website-to-CMS Importer API
Scrapt eine Website-URL und konvertiert HTML in CMS-Blöcke.
Unterstuetzt selektiven Import einzelner Sections.
"""
import os
from pathlib import Path
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import CmsUser
from app.core.database import get_db
from app.importers.html_to_nodes import parse_html_to_tree
from app.importers.nodes_to_blocks import convert_tree_to_sections
from app.models.page import CmsPage

router = APIRouter(prefix="/api/website-import", tags=["website-import"])


# ─── Request / Response Models ────────────────────────────────────


class ScrapeRequest(BaseModel):
    url: str = Field(..., min_length=1)
    use_cache: bool = True


class ImportRequest(BaseModel):
    page_id: int
    sections: list[dict]
    dry_run: bool = False


class ApplyRequest(BaseModel):
    """Apply scraped sections to an existing CMS page.

    mode="all": Replace all sections (default)
    mode="replace": Replace specific section indices
    mode="append": Append new sections at the end
    """
    page_id: int
    sections: list[dict] = Field(..., min_length=1)
    mode: str = Field(default="all", pattern="^(all|replace|append)$")
    replace_indices: list[int] | None = Field(
        default=None,
        description="Section indices to replace (only for mode=replace)",
    )


class ScrapeResult(BaseModel):
    url: str
    html_length: int
    sections: list[dict]
    block_counts: dict[str, int]
    section_count: int
    block_count: int


# ─── HTML → CMS Sections Parser ──────────────────────────────────


def _parse_html_to_sections(html: str, base_url: str = "") -> list[dict]:
    """Haupt-Parser: HTML → Node-Baum → CMS Sections."""
    tree = parse_html_to_tree(html)
    return convert_tree_to_sections(tree)


def _count_blocks(sections: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for s in sections:
        for col in s.get("columns", []):
            for b in col.get("blocks", []):
                bt = b.get("blockType", "unknown")
                counts[bt] = counts.get(bt, 0) + 1
    return counts


# ─── API Endpoints ────────────────────────────────────────────────


async def _fetch_html(url: str) -> str:
    """Holt HTML — per Dateisystem (Production) oder HTTP-Fallback."""
    static_dir = os.environ.get("SCRAPER_STATIC_DIR", "")
    if static_dir:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/") or "/"
        if path == "/":
            file_path = Path(static_dir) / "index.html"
        else:
            file_path = Path(static_dir) / path.lstrip("/") / "index.html"
        if file_path.is_file():
            return file_path.read_text(encoding="utf-8")
        alt_path = Path(static_dir) / path.lstrip("/")
        if alt_path.is_file():
            return alt_path.read_text(encoding="utf-8")

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30, verify=False) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text
    except httpx.HTTPError as e:
        if static_dir:
            raise HTTPException(
                status_code=404,
                detail=f"Seite nicht gefunden: {url} (weder als Datei noch per HTTP erreichbar)"
            )
        raise HTTPException(status_code=502, detail=f"Seite konnte nicht geladen werden: {e}")


@router.post("/scrape", response_model=ScrapeResult)
async def scrape_and_parse(req: ScrapeRequest):
    """Scrapt eine URL und gibt die erkannten CMS-Blöcke zurück."""
    html = await _fetch_html(req.url)
    sections = _parse_html_to_sections(html, req.url)
    block_counts = _count_blocks(sections)

    return ScrapeResult(
        url=req.url,
        html_length=len(html),
        sections=sections,
        block_counts=block_counts,
        section_count=len(sections),
        block_count=sum(block_counts.values()),
    )


@router.post("/preview")
async def preview_import(req: ScrapeRequest):
    """Wie scrape, aber gibt auch eine Vorschau-Zusammenfassung."""
    result = await scrape_and_parse(req)
    return {
        "url": result.url,
        "section_count": result.section_count,
        "block_count": result.block_count,
        "block_counts": result.block_counts,
        "sections": result.sections,
    }


@router.post("/apply")
async def apply_import(
    req: ApplyRequest,
    user: CmsUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply scraped sections to a CMS page.

    Modes:
      all     — Replace all sections (default)
      replace — Replace specific section indices (keeps others)
      append  — Append sections at end
    """
    result = await db.execute(
        select(CmsPage).where(
            CmsPage.id == req.page_id,
            CmsPage.tenant_id == user.tenant_id,
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    existing = page.sections or []

    if req.mode == "all":
        page.sections = req.sections
    elif req.mode == "append":
        page.sections = existing + req.sections
    elif req.mode == "replace":
        if not req.replace_indices:
            raise HTTPException(status_code=400, detail="replace_indices required for mode=replace")
        updated = list(existing)
        for i, section in zip(req.replace_indices, req.sections):
            if 0 <= i < len(updated):
                updated[i] = section
            else:
                updated.append(section)
        page.sections = updated

    await db.flush()
    await db.refresh(page)

    return {
        "page_id": page.id,
        "slug": page.slug,
        "mode": req.mode,
        "section_count": len(page.sections),
        "replaced_indices": req.replace_indices if req.mode == "replace" else None,
    }
