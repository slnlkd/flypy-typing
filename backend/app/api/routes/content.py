from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.content import ContentArticle

router = APIRouter()


class ArticleItem(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str
    tags: list[str]
    content: str
    updatedAt: str


class ArticleListResponse(BaseModel):
    articles: list[ArticleItem]


def serialize_article(article: ContentArticle) -> ArticleItem:
    return ArticleItem(
        id=str(article.id),
        title=article.title,
        category=article.category,
        difficulty=article.difficulty,
        tags=article.tags,
        content=article.content,
        updatedAt=article.updated_at.isoformat(),
    )


@router.get("/articles", response_model=ArticleListResponse)
async def list_articles(
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> ArticleListResponse:
    query = select(ContentArticle).order_by(ContentArticle.updated_at.desc())
    if category:
        query = query.where(ContentArticle.category == category)
    if difficulty:
        query = query.where(ContentArticle.difficulty == difficulty)
    result = await db.execute(query)
    return ArticleListResponse(articles=[serialize_article(article) for article in result.scalars().all()])


@router.get("/legacy/articles", response_model=ArticleListResponse, include_in_schema=False)
async def list_articles_legacy(
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> ArticleListResponse:
    return await list_articles(category=category, difficulty=difficulty, db=db)
