import re
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
import httpx
import logging

import app.core.security as security

logger = logging.getLogger("ivitsh_portal.schedule")
router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

EIOS_BASE_URL = "https://eios.kosgos.ru/api"

# Validation patterns
_YEAR_RE = re.compile(r'^\d{4}-\d{4}$')
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

FALLBACK_GROUPS = [
    {"id": 8540, "name": "24-ИСбо-1"},
    {"id": 8541, "name": "24-ИСбо-2"},
    {"id": 8542, "name": "25-ИВТбо-1"},
    {"id": 8543, "name": "25-ИВТбо-2"},
    {"id": 8544, "name": "23-ИВТбо-1"},
    {"id": 8545, "name": "22-ИВТбо-1"}
]

FALLBACK_TEACHERS = [
    {"id": 101, "name": "Киприна Людмила Юрьевна"},
    {"id": 102, "name": "Барило Илья Иванович"},
    {"id": 103, "name": "Лустгартен Юрий Леонидович"},
    {"id": 104, "name": "Красавина Мария Сергеевна"},
    {"id": 105, "name": "Прядкина Нина Олеговна"},
    {"id": 106, "name": "Демчинова Екатерина Игоревна"}
]

FALLBACK_AUDITORIES = [
    {"id": 209, "name": "Б-209 (Дирекция)"},
    {"id": 301, "name": "Б-301 (Лаборатория)"},
    {"id": 305, "name": "Б-305 (Компьютерный класс)"},
    {"id": 401, "name": "Б-401 (Коворкинг)"}
]

FALLBACK_RASP = [
    {
        "dis": "лек Алгоритмы и структуры данных",
        "disciplina": "Алгоритмы и структуры данных",
        "prep": "Барило Илья Иванович",
        "aud": "Б-305",
        "type": "Лекция",
        "time": "08:30-10:00",
        "day": "Понедельник",
        "date": "2026-08-17"
    },
    {
        "dis": "лаб Разработка веб-приложений",
        "disciplina": "Разработка веб-приложений",
        "prep": "Лустгартен Юрий Леонидович",
        "aud": "Б-301",
        "type": "Лабораторная",
        "time": "10:10-11:40",
        "day": "Понедельник",
        "date": "2026-08-17"
    },
    {
        "dis": "пр Высшая математика",
        "disciplina": "Высшая математика",
        "prep": "Красавина Мария Сергеевна",
        "aud": "Б-214",
        "type": "Практическое",
        "time": "12:10-13:40",
        "day": "Вторник",
        "date": "2026-08-18"
    }
]


def _validate_year(year: str) -> None:
    if not _YEAR_RE.match(year):
        raise HTTPException(status_code=400, detail="Неверный формат учебного года. Ожидается: YYYY-YYYY (например 2025-2026)")


def _validate_sdate(sdate: str) -> None:
    if not _DATE_RE.match(sdate):
        raise HTTPException(status_code=400, detail="Неверный формат даты. Ожидается: YYYY-MM-DD")


async def _fetch_eios(endpoint: str, params: dict, timeout: float = 2.5):
    url = f"{EIOS_BASE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(verify=security.VERIFY_SSL, timeout=timeout) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 451 or "отключите vpn" in resp.text.lower():
                logger.warning(f"[EIOS BLOCK] 451 access denied on {url}")
                return None
            if resp.status_code == 200:
                return resp.json()
            return None
    except Exception as e:
        logger.warning(f"[EIOS FETCH FAST FALLBACK] Connection to {url} timed out or failed: {e}")
        return None


@router.get("/years")
async def get_eios_years():
    data = await _fetch_eios("Rasp/ListYears", {})
    if data:
        return data
    return {"data": {"years": ["2025-2026", "2024-2025", "2026-2027"]}, "state": 1}


@router.get("/groups")
async def get_eios_groups(year: str = Query("2025-2026")):
    _validate_year(year)
    data = await _fetch_eios("raspGrouplist", {"year": year})
    if data and "data" in data and data["data"]:
        return data
    return {"data": FALLBACK_GROUPS, "state": 1}


@router.get("/teachers")
async def get_eios_teachers(year: str = Query("2025-2026")):
    _validate_year(year)
    data = await _fetch_eios("raspTeacherlist", {"year": year})
    if data and "data" in data and data["data"]:
        return data
    return {"data": FALLBACK_TEACHERS, "state": 1}


@router.get("/auditories")
async def get_eios_auditories(year: str = Query("2025-2026")):
    _validate_year(year)
    data = await _fetch_eios("raspAudlist", {"year": year})
    if data and "data" in data and data["data"]:
        return data
    return {"data": FALLBACK_AUDITORIES, "state": 1}


@router.get("/rasp")
async def get_eios_rasp(
    idGroup: Optional[int] = Query(None),
    idTeacher: Optional[int] = Query(None),
    idAud: Optional[int] = Query(None),
    year: str = Query("2025-2026"),
    sdate: Optional[str] = Query(None)
):
    _validate_year(year)
    if sdate:
        _validate_sdate(sdate)

    params = {"year": year}
    if idGroup:
        params["idGroup"] = idGroup
    if idTeacher:
        params["idTeacher"] = idTeacher
    if idAud:
        params["idAud"] = idAud
    if sdate:
        params["sdate"] = sdate

    data = await _fetch_eios("Rasp", params, timeout=3.0)
    if data and "data" in data and data["data"]:
        return data
    return {"data": FALLBACK_RASP, "state": 1}

