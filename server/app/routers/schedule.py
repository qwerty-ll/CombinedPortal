import asyncio
import re
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import timetable
import app.models as models

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

_YEAR_RE = re.compile(r'^\d{4}-\d{4}$')
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

# Reference lists change rarely; the timetable itself can change during the day.
_LIST_TTL = timetable.LIST_TTL
_RASP_TTL = timetable.RASP_TTL

_UNAVAILABLE = "Расписание ЭИОС КГУ сейчас недоступно. Попробуйте позже или откройте eios.kosgos.ru."


def _validate_year(year: str) -> None:
    if not _YEAR_RE.match(year):
        raise HTTPException(status_code=400, detail="Неверный формат учебного года. Ожидается: YYYY-YYYY (например 2025-2026)")


def _validate_sdate(sdate: str) -> None:
    if not _DATE_RE.match(sdate):
        raise HTTPException(status_code=400, detail="Неверный формат даты. Ожидается: YYYY-MM-DD")


def clear_cache() -> None:
    timetable.clear_cache()


async def _cached_eios(endpoint: str, params: dict, ttl: int) -> dict:
    try:
        return await timetable.cached(endpoint, params, ttl)
    except timetable.TimetableUnavailable:
        # Never invent a timetable: tell the client EIOS is unavailable instead.
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)


@router.get("/years")
async def get_eios_years():
    return await _cached_eios("Rasp/ListYears", {}, _LIST_TTL)


@router.get("/groups")
async def get_eios_groups(year: str = Query("2025-2026")):
    _validate_year(year)
    return await _cached_eios("raspGrouplist", {"year": year}, _LIST_TTL)


@router.get("/teachers")
async def get_eios_teachers(year: str = Query("2025-2026")):
    _validate_year(year)
    return await _cached_eios("raspTeacherlist", {"year": year}, _LIST_TTL)


@router.get("/auditories")
async def get_eios_auditories(year: str = Query("2025-2026")):
    _validate_year(year)
    return await _cached_eios("raspAudlist", {"year": year}, _LIST_TTL)


@router.get("/rasp")
async def get_eios_rasp(
    idGroup: Optional[int] = Query(None, ge=1),
    idTeacher: Optional[int] = Query(None, ge=1),
    idAud: Optional[int] = Query(None, ge=1),
    year: str = Query("2025-2026"),
    sdate: Optional[str] = Query(None)
):
    _validate_year(year)
    if sdate:
        _validate_sdate(sdate)
    if not (idGroup or idTeacher or idAud):
        raise HTTPException(status_code=400, detail="Укажите группу, преподавателя или аудиторию")

    params = {"year": year}
    if idGroup:
        params["idGroup"] = idGroup
    if idTeacher:
        params["idTeacher"] = idTeacher
    if idAud:
        params["idAud"] = idAud
    if sdate:
        params["sdate"] = sdate
    return await _cached_eios("Rasp", params, _RASP_TTL)


@router.get("/teachers/today")
async def get_teachers_today(db: Session = Depends(get_db)):
    """Today's lessons of every teacher on the portal, keyed by portal teacher id.

    Teachers EIOS does not know by that exact name are left out. The client works out
    "ведёт пару" / "свободен до" from these times with its own clock.
    """
    now = timetable.msk_now()
    today = now.date()
    try:
        ids_by_name = await timetable.teacher_ids(timetable.academic_year(today))
    except timetable.TimetableUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)

    wanted = [
        (teacher.id, ids_by_name[key])
        for teacher in db.query(models.Teacher).all()
        if (key := timetable.normalize_name(teacher.name)) in ids_by_name
    ]
    # A handful of requests at a time: the first visit of the day fills the cache for everyone.
    slots = asyncio.Semaphore(4)

    async def day_of(eios_ids):
        async with slots:
            try:
                return await timetable.teacher_day(eios_ids, today)
            except timetable.TimetableUnavailable:
                return None

    days = await asyncio.gather(*(day_of(eios_ids) for _, eios_ids in wanted))
    return {
        "date": today.isoformat(),
        "teachers": {
            str(teacher_id): [lesson.as_dict() for lesson in lessons]
            for (teacher_id, _), lessons in zip(wanted, days)
            if lessons is not None
        },
    }
