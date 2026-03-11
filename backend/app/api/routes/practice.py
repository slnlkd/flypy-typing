from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.practice import PracticeRecord, WrongCharStat
from app.models.user import User

router = APIRouter()


class PracticeRecordItem(BaseModel):
    id: str
    date: str
    mode: str
    speed: int
    accuracy: int
    totalChars: int
    correctChars: int
    wrongChars: int
    maxCombo: int
    duration: int


class WrongCharItem(BaseModel):
    char: str
    pinyin: str
    flypyCode: str
    count: int


class PracticeRecordEnvelope(BaseModel):
    records: list[PracticeRecordItem]


class WrongCharEnvelope(BaseModel):
    wrongChars: list[WrongCharItem]


class CreatePracticeRecordRequest(BaseModel):
    record: PracticeRecordItem


class BatchPracticeRecordsRequest(BaseModel):
    records: list[PracticeRecordItem]


class BatchWrongCharsRequest(BaseModel):
    wrongChars: list[WrongCharItem]


def serialize_record(record: PracticeRecord) -> PracticeRecordItem:
    return PracticeRecordItem(
        id=str(record.id),
        date=record.created_at.isoformat(),
        mode=record.mode,
        speed=record.speed,
        accuracy=record.accuracy,
        totalChars=record.total_chars,
        correctChars=record.correct_chars,
        wrongChars=record.wrong_chars,
        maxCombo=record.max_combo,
        duration=record.duration,
    )


def serialize_wrong_char(record: WrongCharStat) -> WrongCharItem:
    return WrongCharItem(
        char=record.char,
        pinyin=record.pinyin,
        flypyCode=record.flypy_code,
        count=record.count,
    )


async def list_user_records(db: AsyncSession, user_id: int) -> list[PracticeRecord]:
    result = await db.execute(
        select(PracticeRecord)
        .where(PracticeRecord.user_id == user_id)
        .order_by(PracticeRecord.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())


async def list_user_wrong_chars(db: AsyncSession, user_id: int) -> list[WrongCharStat]:
    result = await db.execute(
        select(WrongCharStat)
        .where(WrongCharStat.user_id == user_id)
        .order_by(WrongCharStat.count.desc())
        .limit(100)
    )
    return list(result.scalars().all())


@router.get("/history", response_model=list[PracticeRecordItem])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[PracticeRecord]:
    records = await list_user_records(db, current_user.id)
    return [serialize_record(record) for record in records]


@router.get("/wrong-chars", response_model=list[WrongCharItem])
async def get_wrong_chars(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[WrongCharStat]:
    wrong_chars = await list_user_wrong_chars(db, current_user.id)
    return [serialize_wrong_char(item) for item in wrong_chars]


@router.get("/records", response_model=PracticeRecordEnvelope)
async def get_records(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PracticeRecordEnvelope:
    records = await list_user_records(db, current_user.id)
    return PracticeRecordEnvelope(records=[serialize_record(record) for record in records])


@router.post("/records", response_model=PracticeRecordEnvelope)
async def create_record(
    payload: CreatePracticeRecordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PracticeRecordEnvelope:
    record = payload.record
    created_at = datetime.fromisoformat(record.date.replace("Z", "+00:00")) if record.date else datetime.now(UTC)
    db.add(
        PracticeRecord(
            user_id=current_user.id,
            mode=record.mode,
            speed=record.speed,
            accuracy=record.accuracy,
            total_chars=record.totalChars,
            correct_chars=record.correctChars,
            wrong_chars=record.wrongChars,
            max_combo=record.maxCombo,
            duration=record.duration,
            created_at=created_at,
        )
    )
    await db.commit()
    records = await list_user_records(db, current_user.id)
    return PracticeRecordEnvelope(records=[serialize_record(item) for item in records])


@router.post("/records/batch-sync", response_model=PracticeRecordEnvelope)
async def batch_sync_records(
    payload: BatchPracticeRecordsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PracticeRecordEnvelope:
    existing = await list_user_records(db, current_user.id)
    existing_keys = {
        (
            item.created_at.isoformat(),
            item.mode,
            item.speed,
            item.accuracy,
            item.total_chars,
            item.correct_chars,
            item.wrong_chars,
            item.max_combo,
            item.duration,
        )
        for item in existing
    }
    for record in payload.records:
        created_at = datetime.fromisoformat(record.date.replace("Z", "+00:00")) if record.date else datetime.now(UTC)
        key = (
            created_at.isoformat(),
            record.mode,
            record.speed,
            record.accuracy,
            record.totalChars,
            record.correctChars,
            record.wrongChars,
            record.maxCombo,
            record.duration,
        )
        if key in existing_keys:
            continue
        db.add(
            PracticeRecord(
                user_id=current_user.id,
                mode=record.mode,
                speed=record.speed,
                accuracy=record.accuracy,
                total_chars=record.totalChars,
                correct_chars=record.correctChars,
                wrong_chars=record.wrongChars,
                max_combo=record.maxCombo,
                duration=record.duration,
                created_at=created_at,
            )
        )
        existing_keys.add(key)
    await db.commit()
    records = await list_user_records(db, current_user.id)
    return PracticeRecordEnvelope(records=[serialize_record(item) for item in records])


@router.get("/wrong-char-stats", response_model=WrongCharEnvelope)
async def get_wrong_char_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> WrongCharEnvelope:
    wrong_chars = await list_user_wrong_chars(db, current_user.id)
    return WrongCharEnvelope(wrongChars=[serialize_wrong_char(item) for item in wrong_chars])


@router.post("/wrong-char-stats/batch-sync", response_model=WrongCharEnvelope)
async def batch_sync_wrong_char_stats(
    payload: BatchWrongCharsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> WrongCharEnvelope:
    result = await db.execute(select(WrongCharStat).where(WrongCharStat.user_id == current_user.id))
    current_items = {item.char: item for item in result.scalars().all()}

    for item in payload.wrongChars:
        existing = current_items.get(item.char)
        if existing:
            existing.count = max(existing.count, item.count)
            existing.pinyin = item.pinyin or existing.pinyin
            existing.flypy_code = item.flypyCode or existing.flypy_code
            existing.updated_at = datetime.now(UTC)
            continue
        created = WrongCharStat(
            user_id=current_user.id,
            char=item.char,
            pinyin=item.pinyin,
            flypy_code=item.flypyCode,
            count=item.count,
            updated_at=datetime.now(UTC),
        )
        db.add(created)
        current_items[item.char] = created

    await db.commit()
    wrong_chars = await list_user_wrong_chars(db, current_user.id)
    return WrongCharEnvelope(wrongChars=[serialize_wrong_char(item) for item in wrong_chars])
