"""AI field content generation service (OpenAI-compatible endpoint)."""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("cms.ai")


async def generate_field_content(
    ai_config: dict, item_data: dict, field_name: str,
) -> str:
    """Generate content for a field using an OpenAI-compatible API.

    Args:
        ai_config: Field AI configuration with prompt, source_fields, max_length.
        item_data: Current item data for context.
        field_name: Name of the target field.

    Returns:
        Generated text content.

    Raises:
        ValueError: If AI is not configured or generation fails.
    """
    if not settings.AI_ENDPOINT_URL:
        raise ValueError("KI nicht konfiguriert (AI_ENDPOINT_URL nicht gesetzt)")

    prompt_template = ai_config.get("prompt", "")
    if not prompt_template:
        raise ValueError("Kein Prompt-Template konfiguriert")

    source_fields = ai_config.get("source_fields", [])
    max_length = ai_config.get("max_length", settings.AI_MAX_TOKENS)

    # Build context from source fields
    context_parts = []
    for sf in source_fields:
        val = item_data.get(sf, "")
        if val:
            context_parts.append(f"{sf}: {val}")
    context = "\n".join(context_parts) if context_parts else "Keine Kontextdaten"

    # Replace template variables
    prompt = prompt_template.replace("{field_name}", field_name)
    prompt = prompt.replace("{max_length}", str(max_length))
    prompt = prompt.replace("{context}", context)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.AI_ENDPOINT_URL.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.AI_MODEL,
                    "messages": [
                        {"role": "system", "content": "Du bist ein hilfreicher Content-Assistent für ein CMS."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_length,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        logger.error("AI API error: %s", e.response.text)
        raise ValueError(f"KI-Fehler: HTTP {e.response.status_code}")
    except Exception as e:
        logger.error("AI generation failed: %s", e)
        raise ValueError(f"KI-Generierung fehlgeschlagen: {e}")
