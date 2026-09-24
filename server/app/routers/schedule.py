import re
import time
from typing import Any, Dict, Optional, Tuple

from fastapi import APIRouter, Query, HTTPException

from app.services import eios

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

_YEAR_RE = re.compile(r'^\d{4}-\d{4}$')
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

# Reference lists change rarely; the timetable itself can change during the day.
_LIST_TTL = 6 * 60 * 60
_RASP_TTL = 10 * 60
# When EIOS is down we keep serving the last real answer for up to a day, marked as stale.
_STALE_TTL = 24 * 60 * 60
_MAX_CACHE_ENTRIES = 2000

_cache: Dict[Tuple, Tuple[float, Any]] = {}


def _validate_year(year: str) -> None:
    if not _YEAR_RE.match(year):
        raise HTTPException(status_code=400, detail="Неверный формат учебного года. Ожидается: YYYY-YYYY (например 2025-2026)")


def _validate_sdate(sdate: str) -> None:
    if not _DATE_RE.match(sdate):
        raise HTTPException(status_code=400, detail="Неверный формат даты. Ожидается: YYYY-MM-DD")


def clear_cache() -> None:
    _cache.clear()


async def _cached_eios(endpoint: str, params: dict, ttl: int) -> dict:
    key = (endpoint, tuple(sorted(params.items())))
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached[0] < ttl:
        return cached[1]

    data = await eios.fetch_json(endpoint, params)
    # An empty timetable (holidays) is a valid answer; only a missing payload or failed state is an error.
    if isinstance(data, dict) and data.get("data") is not None and data.get("state", 1) == 1:
        if len(_cache) >= _MAX_CACHE_ENTRIES:
            _cache.pop(min(_cache, key=lambda k: _cache[k][0]))
        _cache[key] = (now, data)
        return data

    if cached and now - cached[0] < _STALE_TTL:
        return {**cached[1], "stale": True, "cached_at": int(cached[0])}
    # Never invent a timetable: tell the client EIOS is unavailable instead.
    raise HTTPException(status_code=503, detail="Расписание ЭИОС КГУ сейчас недоступно. Попробуйте позже или откройте eios.kosgos.ru.")


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
