from typing import Optional
from fastapi import APIRouter, Query
import requests

import app.core.security as security

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

EIOS_BASE_URL = "https://eios.kosgos.ru/api"

def _fetch_eios(endpoint: str, params: dict, timeout: int = 12):
    url = f"{EIOS_BASE_URL}/{endpoint}"
    try:
        resp = requests.get(url, params=params, timeout=timeout, verify=security.VERIFY_SSL)
        if resp.status_code == 451 or "отключите vpn" in resp.text.lower():
            return None
        return resp.json()
    except Exception:
        try:
            resp = requests.get(url, params=params, timeout=timeout, verify=False)
            if resp.status_code == 451 or "отключите vpn" in resp.text.lower():
                return None
            return resp.json()
        except Exception:
            return None

@router.get("/years")
def get_eios_years():
    data = _fetch_eios("Rasp/ListYears", {})
    if data:
        return data
    return {"data": {"years": ["2025-2026", "2024-2025"]}, "state": 1}

@router.get("/groups")
def get_eios_groups(year: str = Query("2025-2026")):
    data = _fetch_eios("raspGrouplist", {"year": year})
    if data and "data" in data:
        return data
    return {"data": [], "error": "Не удалось загрузить список групп ЭИОС"}

@router.get("/teachers")
def get_eios_teachers(year: str = Query("2025-2026")):
    data = _fetch_eios("raspTeacherlist", {"year": year})
    if data and "data" in data:
        return data
    return {"data": [], "error": "Не удалось загрузить список преподавателей ЭИОС"}

@router.get("/auditories")
def get_eios_auditories(year: str = Query("2025-2026")):
    data = _fetch_eios("raspAudlist", {"year": year})
    if data and "data" in data:
        return data
    return {"data": [], "error": "Не удалось загрузить список аудиторий ЭИОС"}

@router.get("/rasp")
def get_eios_rasp(
    idGroup: Optional[int] = Query(None),
    idTeacher: Optional[int] = Query(None),
    idAud: Optional[int] = Query(None),
    year: str = Query("2025-2026"),
    sdate: Optional[str] = Query(None)
):
    params = {"year": year}
    if idGroup: params["idGroup"] = idGroup
    if idTeacher: params["idTeacher"] = idTeacher
    if idAud: params["idAud"] = idAud
    if sdate: params["sdate"] = sdate

    data = _fetch_eios("Rasp", params, timeout=15)
    if data and "data" in data:
        return data
    return {"data": {"rasp": []}, "error": "Не удалось загрузить расписание ЭИОС"}
