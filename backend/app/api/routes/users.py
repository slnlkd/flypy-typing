from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.user import User, UserSettings

router = APIRouter()


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    userId: str
    email: str
    displayName: str
    createdAt: str
    lastLoginAt: str
    isAdmin: bool


class UserSettingsResponse(BaseModel):
    darkMode: bool
    showKeyboard: bool
    showPinyin: bool
    highlightKeys: bool
    fontSize: int
    soundEnabled: bool
    soundVolume: int
    charCount: int
    phraseCount: int
    charPool: int
    practiceType: str
    timerMode: str | int
    dailyGoalChars: int


class SettingsEnvelope(BaseModel):
    settings: UserSettingsResponse


class MeEnvelope(BaseModel):
    user: MeResponse


class UpdateSettingsRequest(BaseModel):
    settings: UserSettingsResponse


def serialize_settings(settings: UserSettings) -> UserSettingsResponse:
    timer_mode: str | int = settings.timer_mode
    if settings.timer_mode.isdigit():
        timer_mode = int(settings.timer_mode)

    return UserSettingsResponse(
        darkMode=settings.dark_mode,
        showKeyboard=settings.show_keyboard,
        showPinyin=settings.show_pinyin,
        highlightKeys=settings.highlight_keys,
        fontSize=settings.font_size,
        soundEnabled=settings.sound_enabled,
        soundVolume=settings.sound_volume,
        charCount=settings.char_count,
        phraseCount=settings.phrase_count,
        charPool=settings.char_pool,
        practiceType=settings.practice_type,
        timerMode=timer_mode,
        dailyGoalChars=settings.daily_goal_chars,
    )


@router.get("", response_model=MeEnvelope)
async def read_me(current_user: User = Depends(get_current_user)) -> MeEnvelope:
    return MeEnvelope(
        user=MeResponse(
            userId=str(current_user.id),
            email=current_user.email,
            displayName=current_user.display_name,
            createdAt=current_user.created_at.isoformat(),
            lastLoginAt=(current_user.last_login_at or current_user.created_at).isoformat(),
            isAdmin=current_user.is_admin,
        )
    )


@router.get("/settings", response_model=SettingsEnvelope)
async def read_my_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsEnvelope:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one()
    return SettingsEnvelope(settings=serialize_settings(settings))


@router.put("/settings", response_model=SettingsEnvelope)
async def update_my_settings(
    payload: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsEnvelope:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one()
    incoming = payload.settings
    settings.dark_mode = incoming.darkMode
    settings.show_keyboard = incoming.showKeyboard
    settings.show_pinyin = incoming.showPinyin
    settings.highlight_keys = incoming.highlightKeys
    settings.font_size = incoming.fontSize
    settings.sound_enabled = incoming.soundEnabled
    settings.sound_volume = incoming.soundVolume
    settings.char_count = incoming.charCount
    settings.phrase_count = incoming.phraseCount
    settings.char_pool = incoming.charPool
    settings.practice_type = incoming.practiceType
    settings.timer_mode = str(incoming.timerMode)
    settings.daily_goal_chars = incoming.dailyGoalChars
    await db.commit()
    await db.refresh(settings)
    return SettingsEnvelope(settings=serialize_settings(settings))
