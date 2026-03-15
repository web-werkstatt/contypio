"""AI Content Generator: Prompt-Templates + Style-Guide + LLM-Call."""

import logging

import httpx

from app.core.config import settings
from app.services.content_quality import evaluate_text

logger = logging.getLogger("cms.ai")

DEFAULT_STYLE_GUIDE = """Ton: direkt, konkret, technisch fundiert, keine Marketing-Floskeln
Satzlänge: maximal 20 Wörter, kurze Absätze
Ansprache: Du-Form, wie ein erfahrener Berater
Verboten: revolutionär, einzigartig, gamechanger, maßgeschneidert, innovativ, ganzheitlich, nachhaltig, state-of-the-art, Synergien
Bevorzugt: konkrete Zahlen, Beispiele, Verben statt Adjektive
Struktur: Hook → Problem → Lösung → CTA"""

CHANNEL_RULES: dict[str, str] = {
    "linkedin": "LinkedIn-Post: 900–1300 Zeichen. Hook in Zeile 1. Absätze mit Leerzeilen. 3–5 Hashtags am Ende. Keine Emojis im Fließtext.",
    "blog": "Blog-Intro: 800–1500 Wörter. H2-Zwischenüberschriften. Kurze Absätze (max 3 Sätze). Kein Keyword-Stuffing.",
    "newsletter": "Newsletter: 150–250 Wörter. Persönliche Ansprache. Ein klarer CTA-Button-Text am Ende.",
    "social": "Social-Post: Maximal 280 Zeichen. Knackig, provokant oder mit Frage. Ein Hashtag.",
}

SYSTEM_PROMPT = """Du bist ein erfahrener deutscher Copywriter für B2B-Dienstleistungen.
Schreibe ausschließlich auf Deutsch. Halte dich strikt an den Style-Guide und die Kanal-Regeln.

## Style-Guide
{style_guide}

## Kanal-Regeln
{channel_rules}"""

USER_PROMPT = """Schreibe einen {channel_label}-Text für den Service "{service_name}".

Keywords: {keywords}
Zielgruppe: {target_audience}
{notes_section}
Liefere NUR den fertigen Text, keine Erklärungen oder Meta-Kommentare."""


async def generate_content(
    service_name: str,
    channel: str,
    channel_label: str,
    keywords: str = "",
    target_audience: str = "",
    notes: str = "",
    style_guide: str = "",
    temperature: float = 0.7,
) -> dict:
    """Generate content via OpenAI-compatible endpoint. Returns dict with content, model, tokens."""
    if not settings.AI_ENDPOINT_URL:
        raise ValueError("KI nicht konfiguriert (AI_ENDPOINT_URL nicht gesetzt)")

    guide = style_guide or DEFAULT_STYLE_GUIDE
    channel_rule = CHANNEL_RULES.get(channel, "")

    system = SYSTEM_PROMPT.format(style_guide=guide, channel_rules=channel_rule)
    notes_section = f"Zusätzliche Hinweise: {notes}" if notes else ""
    user = USER_PROMPT.format(
        channel_label=channel_label,
        service_name=service_name,
        keywords=keywords or "keine",
        target_audience=target_audience or "B2B Entscheider",
        notes_section=notes_section,
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.AI_ENDPOINT_URL.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.AI_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": 2000,
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return {"content": content, "model": data.get("model", settings.AI_MODEL), "tokens_used": tokens}
    except httpx.HTTPStatusError as e:
        logger.error("AI API error: %s", e.response.text[:200])
        raise ValueError(f"KI-Fehler: HTTP {e.response.status_code}")
    except httpx.ConnectError:
        raise ValueError("KI-Endpoint nicht erreichbar")
    except Exception as e:
        logger.error("AI generation failed: %s", e)
        raise ValueError(f"KI-Generierung fehlgeschlagen: {e}")


async def generate_variants(
    service_name: str,
    channel: str,
    channel_label: str,
    keywords: str = "",
    target_audience: str = "",
    notes: str = "",
    style_guide: str = "",
    num_variants: int = 1,
) -> list[dict]:
    """Generate 1-3 variants with different temperatures, each with quality score."""
    temps = [0.7, 0.9, 0.5][:num_variants]
    variants = []
    for temp in temps:
        result = await generate_content(
            service_name=service_name, channel=channel, channel_label=channel_label,
            keywords=keywords, target_audience=target_audience, notes=notes,
            style_guide=style_guide, temperature=temp,
        )
        quality = evaluate_text(result["content"], channel)
        result["quality_score"] = quality
        result["temperature"] = temp
        variants.append(result)
    return variants
