from datetime import UTC, datetime, timedelta
from secrets import token_hex

from jose import jwt

from app.core.config import settings


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": subject, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, expires_delta: timedelta | None = None) -> tuple[str, str]:
    token_id = token_hex(16)
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.refresh_token_expire_minutes))
    payload = {"sub": subject, "type": "refresh", "jti": token_id, "exp": expire}
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, token_id
