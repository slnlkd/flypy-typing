from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db_session
from app.models.content import ContentArticle
from app.models.practice import PracticeRecord
from app.models.user import User

router = APIRouter()


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_articles: int
    total_practice_records: int


@router.get("/stats/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
) -> AdminOverviewResponse:
    total_users = await db.scalar(select(func.count(User.id)))
    total_articles = await db.scalar(select(func.count(ContentArticle.id)))
    total_records = await db.scalar(select(func.count(PracticeRecord.id)))
    return AdminOverviewResponse(
        total_users=total_users or 0,
        total_articles=total_articles or 0,
        total_practice_records=total_records or 0,
    )
