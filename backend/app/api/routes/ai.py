from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db_session
from app.models.ai import AIModelConfig, CoachRecommendation, KnowledgeBase
from app.models.user import User
from app.services.coach import CoachService
from app.services.knowledge_base import KnowledgeBaseService

router = APIRouter()
coach_service = CoachService()
knowledge_service = KnowledgeBaseService()


class AIModelConfigItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    provider: str
    model_type: str
    model_name: str
    is_enabled: bool


class CoachRecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recommendation_type: str
    title: str
    content: str
    status: str
    created_at: datetime


class KnowledgeBaseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    status: str


class PracticeRecordPayload(BaseModel):
    mode: str
    speed: int
    accuracy: int
    totalChars: int
    correctChars: int
    wrongChars: int
    maxCombo: int
    duration: int
    date: str


class WrongCharPayload(BaseModel):
    char: str
    pinyin: str
    flypyCode: str
    count: int


class CitationItem(BaseModel):
    title: str
    content: str


class TaskItem(BaseModel):
    title: str
    focus: str
    description: str


class AnalyzeCoachRequest(BaseModel):
    goal: str = "综合提升"
    records: list[PracticeRecordPayload] = Field(default_factory=list)
    wrongChars: list[WrongCharPayload] = Field(default_factory=list)


class AnalyzeCoachResponse(BaseModel):
    summary: str
    weaknesses: list[str]
    recommendedFocus: list[str]
    tasks: list[TaskItem]
    citations: list[CitationItem]
    meta: dict[str, bool]


class GenerateTasksRequest(BaseModel):
    goal: str = "综合提升"
    records: list[PracticeRecordPayload] = Field(default_factory=list)
    wrongChars: list[WrongCharPayload] = Field(default_factory=list)


class GenerateTasksResponse(BaseModel):
    summary: str
    tasks: list[TaskItem]


class GenerateContentRequest(BaseModel):
    goal: str = "综合提升"
    contentType: str = "article"
    records: list[PracticeRecordPayload] = Field(default_factory=list)
    wrongChars: list[WrongCharPayload] = Field(default_factory=list)


class GeneratedContentResponse(BaseModel):
    type: str
    title: str
    difficulty: str
    tags: list[str]
    content: str


class AskAIRequest(BaseModel):
    question: str
    records: list[PracticeRecordPayload] = Field(default_factory=list)
    wrongChars: list[WrongCharPayload] = Field(default_factory=list)


class AskAIResponse(BaseModel):
    answer: str
    citations: list[CitationItem]


class IngestKnowledgeRequest(BaseModel):
    title: str
    content: str
    metadata: dict[str, str | int | float | bool | list[str] | None] = Field(default_factory=dict)


class IngestKnowledgeResponse(BaseModel):
    knowledgeBaseCode: str
    documentId: int
    chunkCount: int
    status: str


@router.get("/models", response_model=list[AIModelConfigItem])
async def list_model_configs(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
) -> list[AIModelConfig]:
    result = await db.execute(select(AIModelConfig).order_by(AIModelConfig.updated_at.desc()))
    return list(result.scalars().all())


@router.get("/knowledge-bases", response_model=list[KnowledgeBaseItem])
async def list_knowledge_bases(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
) -> list[KnowledgeBase]:
    result = await db.execute(select(KnowledgeBase).order_by(KnowledgeBase.updated_at.desc()))
    return list(result.scalars().all())


@router.get("/coach/recommendations", response_model=list[CoachRecommendationItem])
async def list_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[CoachRecommendation]:
    result = await db.execute(
        select(CoachRecommendation)
        .where(CoachRecommendation.user_id == current_user.id)
        .order_by(CoachRecommendation.created_at.desc())
        .limit(20)
    )
    return list(result.scalars().all())


@router.post("/coach/analyze", response_model=AnalyzeCoachResponse)
async def analyze_coach(
    request: AnalyzeCoachRequest,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AnalyzeCoachResponse:
    result = await coach_service.analyze(
        db=db,
        records=[item.model_dump() for item in request.records],
        wrong_chars=[item.model_dump() for item in request.wrongChars],
        goal=request.goal,
    )
    return AnalyzeCoachResponse(**result)


@router.post("/coach/tasks/generate", response_model=GenerateTasksResponse)
async def generate_coach_tasks(
    request: GenerateTasksRequest,
    _: User = Depends(get_current_user),
) -> GenerateTasksResponse:
    result = await coach_service.generate_tasks(
        records=[item.model_dump() for item in request.records],
        wrong_chars=[item.model_dump() for item in request.wrongChars],
        goal=request.goal,
    )
    return GenerateTasksResponse(**result)


@router.post("/content/generate", response_model=GeneratedContentResponse)
async def generate_content(
    request: GenerateContentRequest,
    _: User = Depends(get_current_user),
) -> GeneratedContentResponse:
    result = await coach_service.generate_content(
        records=[item.model_dump() for item in request.records],
        wrong_chars=[item.model_dump() for item in request.wrongChars],
        goal=request.goal,
        content_type=request.contentType,
    )
    return GeneratedContentResponse(**result)


@router.post("/qa", response_model=AskAIResponse)
async def ask_ai(
    request: AskAIRequest,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AskAIResponse:
    result = await coach_service.answer_question(
        db=db,
        question=request.question,
        records=[item.model_dump() for item in request.records],
        wrong_chars=[item.model_dump() for item in request.wrongChars],
    )
    return AskAIResponse(**result)


@router.post("/knowledge-bases/{code}/ingest", response_model=IngestKnowledgeResponse)
async def ingest_knowledge_document(
    code: str,
    request: IngestKnowledgeRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
) -> IngestKnowledgeResponse:
    result = await knowledge_service.ingest_document(
        db,
        knowledge_base_code=code,
        title=request.title,
        content=request.content,
        metadata=request.metadata,
    )
    return IngestKnowledgeResponse(**result)
