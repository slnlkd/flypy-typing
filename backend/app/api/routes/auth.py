from datetime import UTC, datetime, timedelta
from random import randint
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.api.deps import get_current_user
from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db_session
from app.models.auth import EmailLoginCode, UserSession
from app.models.user import User, UserSettings
from app.services.email import EmailDeliveryError, send_login_code_email

router = APIRouter()


class SendCodeRequest(BaseModel):
    email: EmailStr


class SendCodeResponse(BaseModel):
    message: str
    demoCode: str | None = None
    expiresIn: int


class LoginRequest(BaseModel):
    email: EmailStr
    code: str


class SessionUser(BaseModel):
    userId: str
    email: EmailStr
    display_name: str
    created_at: str
    last_login_at: str


class LoginResponse(BaseModel):
    token: str
    user: SessionUser


@router.post("/email-code", response_model=SendCodeResponse)
async def send_login_code(payload: SendCodeRequest, db: AsyncSession = Depends(get_db_session)) -> SendCodeResponse:
    code = f"{randint(100000, 999999)}"
    now = datetime.now(UTC)

    if settings.smtp_enabled and (not settings.smtp_host or not settings.smtp_from):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SMTP 配置不完整")

    await db.execute(delete(EmailLoginCode).where(EmailLoginCode.email == payload.email))
    db.add(EmailLoginCode(email=payload.email, code=code, expires_at=now + timedelta(minutes=10), created_at=now))
    await db.commit()

    if settings.smtp_enabled:
        try:
            await send_login_code_email(payload.email, code)
        except EmailDeliveryError as exc:
            await db.execute(delete(EmailLoginCode).where(EmailLoginCode.email == payload.email))
            await db.commit()
            root_cause = repr(exc.__cause__) if exc.__cause__ is not None else str(exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"{exc} | root cause: {root_cause}",
            ) from exc

    return SendCodeResponse(
        message="验证码已发送，请查收邮箱",
        demoCode=code if not settings.smtp_enabled else None,
        expiresIn=600,
    )


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db_session)) -> LoginResponse:
    code_result = await db.execute(
        select(EmailLoginCode).where(EmailLoginCode.email == payload.email).order_by(EmailLoginCode.id.desc())
    )
    email_code = code_result.scalar_one_or_none()
    if not email_code or email_code.code != payload.code or email_code.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="验证码无效或已过期")

    user_result = await db.execute(select(User).where(User.email == payload.email))
    user = user_result.scalar_one_or_none()
    if not user:
        user = User(email=payload.email, display_name=payload.email.split("@")[0], status="active")
        db.add(user)
        await db.flush()
        db.add(UserSettings(user_id=user.id))

    user.last_login_at = datetime.now(UTC)
    access_token = create_access_token(str(user.id))
    _, refresh_token_id = create_refresh_token(str(user.id))
    db.add(
        UserSession(
            user_id=user.id,
            token_id=token_hex(16),
            refresh_token_id=refresh_token_id,
            expires_at=datetime.now(UTC) + timedelta(minutes=settings.refresh_token_expire_minutes),
            created_at=datetime.now(UTC),
        )
    )
    await db.execute(delete(EmailLoginCode).where(EmailLoginCode.email == payload.email))
    await db.commit()
    return LoginResponse(
        token=access_token,
        user=SessionUser(
            userId=str(user.id),
            email=user.email,
            display_name=user.display_name,
            created_at=user.created_at.isoformat(),
            last_login_at=(user.last_login_at or datetime.now(UTC)).isoformat(),
        ),
    )


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    await db.execute(delete(UserSession).where(UserSession.user_id == current_user.id))
    await db.commit()
    return response
