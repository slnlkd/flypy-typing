from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(32), default="active")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False)


class UserSettings(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    show_keyboard: Mapped[bool] = mapped_column(Boolean, default=True)
    show_pinyin: Mapped[bool] = mapped_column(Boolean, default=True)
    highlight_keys: Mapped[bool] = mapped_column(Boolean, default=True)
    font_size: Mapped[int] = mapped_column(Integer, default=24)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sound_volume: Mapped[int] = mapped_column(Integer, default=50)
    char_count: Mapped[int] = mapped_column(Integer, default=50)
    phrase_count: Mapped[int] = mapped_column(Integer, default=20)
    char_pool: Mapped[int] = mapped_column(Integer, default=500)
    practice_type: Mapped[str] = mapped_column(String(32), default="random")
    timer_mode: Mapped[str] = mapped_column(String(32), default="none")
    daily_goal_chars: Mapped[int] = mapped_column(Integer, default=1000)

    user: Mapped[User] = relationship(back_populates="settings")
