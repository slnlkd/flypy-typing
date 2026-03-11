from fastapi import APIRouter

from app.api.routes import admin, ai, auth, content, health, practice, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/me", tags=["users"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(practice.router, prefix="/practice", tags=["practice"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
