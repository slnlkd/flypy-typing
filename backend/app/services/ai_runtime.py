from __future__ import annotations

import json
from typing import Any

from app.core.config import settings

try:
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover - optional dependency
    AsyncOpenAI = None


class AIRuntime:
    """Thin wrapper around an OpenAI-compatible chat endpoint."""

    def __init__(self) -> None:
        self._chat_client = None
        self._embedding_client = None
        if AsyncOpenAI and settings.effective_ai_api_key:
            base_url = settings.effective_ai_base_url or None
            self._chat_client = AsyncOpenAI(api_key=settings.effective_ai_api_key, base_url=base_url)
        if AsyncOpenAI and settings.effective_embedding_api_key:
            embedding_base_url = settings.effective_embedding_base_url or None
            self._embedding_client = AsyncOpenAI(
                api_key=settings.effective_embedding_api_key,
                base_url=embedding_base_url,
            )

    @property
    def enabled(self) -> bool:
        return self._chat_client is not None and bool(settings.effective_chat_model)

    @property
    def embedding_enabled(self) -> bool:
        return self._embedding_client is not None and bool(settings.embedding_model)

    async def complete_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
    ) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        response = await self._chat_client.chat.completions.create(
            model=settings.effective_chat_model,
            temperature=settings.chat_temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"{user_prompt}\n\n"
                        f"请仅返回 JSON，对齐以下结构：\n{json.dumps(response_schema, ensure_ascii=False)}"
                    ),
                },
            ],
        )
        content = response.choices[0].message.content if response.choices else None
        if not content:
            return None
        return json.loads(content)

    async def complete_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str | None:
        if not self.enabled:
            return None

        response = await self._chat_client.chat.completions.create(
            model=settings.effective_chat_model,
            temperature=settings.chat_temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content if response.choices else None

    async def embed_texts(self, texts: list[str]) -> list[list[float]] | None:
        if not self.embedding_enabled:
            return None

        response = await self._embedding_client.embeddings.create(
            model=settings.embedding_model,
            input=texts,
            dimensions=settings.embedding_dimensions,
        )
        return [item.embedding for item in response.data]
