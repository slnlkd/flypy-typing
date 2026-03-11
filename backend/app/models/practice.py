from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    mode: Mapped[str] = mapped_column(String(32))
    content_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    content_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timer_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PracticeRecord(Base):
    __tablename__ = "practice_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    mode: Mapped[str] = mapped_column(String(32))
    speed: Mapped[int] = mapped_column(Integer)
    accuracy: Mapped[int] = mapped_column(Integer)
    total_chars: Mapped[int] = mapped_column(Integer)
    correct_chars: Mapped[int] = mapped_column(Integer)
    wrong_chars: Mapped[int] = mapped_column(Integer)
    max_combo: Mapped[int] = mapped_column(Integer)
    duration: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class WrongCharStat(Base):
    __tablename__ = "wrong_char_stats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    char: Mapped[str] = mapped_column(String(16))
    pinyin: Mapped[str] = mapped_column(String(64))
    flypy_code: Mapped[str] = mapped_column(String(32))
    count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
