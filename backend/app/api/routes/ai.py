from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db_session
from app.models.ai import AIModelConfig, CoachRecommendation, KnowledgeBase
from app.models.user import User

router = APIRouter()


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
