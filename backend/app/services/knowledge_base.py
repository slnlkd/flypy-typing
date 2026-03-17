from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import KnowledgeBase, KnowledgeChunk, KnowledgeDocument
from app.services.ai_runtime import AIRuntime

DEFAULT_KNOWLEDGE_BASE_CODE = "flypy-coach"
DEFAULT_KNOWLEDGE_BASE_NAME = "Flypy 双拼教练知识库"

DEFAULT_KNOWLEDGE_DOCUMENTS = [
    {
        "title": "训练节奏建议",
        "content": (
            "提升双拼速度时，先稳住正确率，再逐步提高节奏。建议将 95% 以上正确率作为提速前提。"
            "如果练习中连续出错，应主动降速，优先修正编码和击键路径。"
        ),
        "tags": ["训练", "速度", "正确率"],
    },
    {
        "title": "专项训练策略",
        "content": (
            "如果高频错字集中在少数编码上，应优先做专项练习，而不是继续做大范围随机刷题。"
            "专项训练应围绕重复错误的字、词和对应编码展开。"
        ),
        "tags": ["专项", "错字", "训练"],
    },
    {
        "title": "文章练习方法",
        "content": (
            "文章练习适合提升连续输入稳定性，但不适合在基础编码尚未熟悉时过早拉高强度。"
            "建议先做短时专项，再做 180 秒左右的文章练习观察稳定性变化。"
        ),
        "tags": ["文章", "稳定性", "连续输入"],
    },
    {
        "title": "声母韵母难点",
        "content": (
            "小鹤双拼的难点通常出现在特殊声母和需要映射转换的韵母。"
            "应将错字先按编码模式聚类，再决定是做声母专项、韵母专项还是综合巩固。"
        ),
        "tags": ["规则", "声母", "韵母", "编码"],
    },
]


@dataclass(frozen=True)
class RetrievedChunk:
    title: str
    content: str
    score: float


def split_text(text: str, *, chunk_size: int = 220, overlap: int = 40) -> list[str]:
    normalized = "".join(line.strip() for line in text.splitlines() if line.strip())
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        chunks.append(normalized[start:end])
        if end >= len(normalized):
            break
        start = max(end - overlap, start + 1)
    return chunks


class KnowledgeBaseService:
    def __init__(self) -> None:
        self.runtime = AIRuntime()

    async def ensure_default_knowledge_base(self, db: AsyncSession) -> None:
        result = await db.execute(
            select(KnowledgeBase).where(KnowledgeBase.code == DEFAULT_KNOWLEDGE_BASE_CODE)
        )
        knowledge_base = result.scalar_one_or_none()
        if knowledge_base is None:
            knowledge_base = KnowledgeBase(
                name=DEFAULT_KNOWLEDGE_BASE_NAME,
                code=DEFAULT_KNOWLEDGE_BASE_CODE,
                description="用于 AI 教练和问答的默认知识库",
                status="active",
            )
            db.add(knowledge_base)
            await db.flush()

        docs_result = await db.execute(
            select(KnowledgeDocument.id).where(KnowledgeDocument.knowledge_base_id == knowledge_base.id)
        )
        if docs_result.first():
            return

        for document in DEFAULT_KNOWLEDGE_DOCUMENTS:
            await self.ingest_document(
                db,
                knowledge_base_code=DEFAULT_KNOWLEDGE_BASE_CODE,
                title=document["title"],
                content=document["content"],
                metadata={"tags": document["tags"], "seeded": True},
                auto_commit=False,
            )
        await db.commit()

    async def ingest_document(
        self,
        db: AsyncSession,
        *,
        knowledge_base_code: str,
        title: str,
        content: str,
        metadata: dict[str, Any] | None = None,
        auto_commit: bool = True,
    ) -> dict[str, Any]:
        result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.code == knowledge_base_code))
        knowledge_base = result.scalar_one_or_none()
        if knowledge_base is None:
            knowledge_base = KnowledgeBase(
                name=knowledge_base_code,
                code=knowledge_base_code,
                description="通过 AI 接口创建的知识库",
                status="active",
            )
            db.add(knowledge_base)
            await db.flush()

        document = KnowledgeDocument(
            knowledge_base_id=knowledge_base.id,
            title=title,
            source_type="text",
            storage_path=None,
            status="indexed",
        )
        db.add(document)
        await db.flush()

        chunks = split_text(content)
        embeddings = await self.embed_texts(chunks)
        for index, (chunk_content, embedding) in enumerate(zip(chunks, embeddings, strict=False)):
            db.add(
                KnowledgeChunk(
                    knowledge_base_id=knowledge_base.id,
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk_content,
                    metadata_json=metadata or {},
                    embedding=embedding,
                )
            )

        if auto_commit:
            await db.commit()
        else:
            await db.flush()

        return {
            "knowledgeBaseCode": knowledge_base.code,
            "documentId": document.id,
            "chunkCount": len(chunks),
            "status": "indexed",
        }

    async def retrieve(
        self,
        db: AsyncSession,
        *,
        query: str,
        knowledge_base_code: str = DEFAULT_KNOWLEDGE_BASE_CODE,
        limit: int = 3,
    ) -> list[RetrievedChunk]:
        result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.code == knowledge_base_code))
        knowledge_base = result.scalar_one_or_none()
        if knowledge_base is None:
            return []

        query_embedding = (await self.embed_texts([query]))[0]
        score_expr = KnowledgeChunk.embedding.cosine_distance(query_embedding)
        query_result = await db.execute(
            select(KnowledgeChunk, KnowledgeDocument.title, score_expr.label("score"))
            .join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeChunk.document_id)
            .where(KnowledgeChunk.knowledge_base_id == knowledge_base.id)
            .order_by(score_expr.asc())
            .limit(max(limit * 4, 8))
        )
        rows = query_result.all()
        keywords = self._extract_keywords(query)
        ranked = []
        for chunk, title, score in rows:
            keyword_hits = self._keyword_overlap(keywords, title, chunk.content)
            hybrid_score = float(score) - keyword_hits * 0.08
            ranked.append(
                RetrievedChunk(
                    title=title,
                    content=chunk.content,
                    score=hybrid_score,
                )
            )
        ranked.sort(key=lambda item: item.score)
        return ranked[:limit]

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        if self.runtime.embedding_enabled:
            embedded = await self.runtime.embed_texts(texts)
            if embedded:
                return embedded

        return [self._hash_embed(text) for text in texts]

    def _hash_embed(self, text: str, dimensions: int = 256) -> list[float]:
        vector = [0.0] * dimensions
        normalized = text.strip()
        if not normalized:
            return vector

        grams: list[str] = []
        chars = list(normalized)
        grams.extend(chars)
        grams.extend("".join(chars[i : i + 2]) for i in range(max(0, len(chars) - 1)))
        for gram in grams:
            digest = hashlib.sha256(gram.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            weight = 1.0 + (digest[5] / 255.0)
            vector[index] += sign * weight

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector
        return [value / norm for value in vector]

    def _extract_keywords(self, text: str) -> list[str]:
        normalized = text.strip().lower()
        if not normalized:
            return []
        chinese_terms = re.findall(r"[\u4e00-\u9fff]{1,4}", normalized)
        ascii_terms = re.findall(r"[a-z0-9]{2,}", normalized)
        return [*chinese_terms, *ascii_terms]

    def _keyword_overlap(self, keywords: list[str], title: str, content: str) -> int:
        haystack = f"{title} {content}".lower()
        return sum(1 for keyword in keywords if keyword and keyword in haystack)
