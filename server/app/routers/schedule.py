from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
import requests
import logging

import app.core.security as security

logger = logging.getLogger("ivitsh_portal.schedule")
router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

EIOS_BASE_URL = "https://eios.kosgos.ru/api"

def _fetch_eios(endpoint: str, params: dict, timeout: int = 12):
    url = f"{EIOS_BASE_URL}/{endpoint}"
    try:
        resp = requests.get(url, params=params, timeout=timeout, verify=security.VERIFY_SSL)
        if resp.status_code == 451 or "отключите vpn" in resp.text.lower():
            logger.warning(f"[EIOS BLOCK] 451 access denied or VPN block on {url}")
            return None
        return resp.json()
    except Exception as e:
        logger.error(f"[EIOS FETCH ERROR] Strict TLS connection error for {url}: {e}")
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
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Не удалось загрузить список групп с сервера ЭИОС КГУ")

@router.get("/teachers")
def get_eios_teachers(year: str = Query("2025-2026")):
    data = _fetch_eios("raspTeacherlist", {"year": year})
    if data and "data" in data:
        return data
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Не удалось загрузить список преподавателей с сервера ЭИОС КГУ")

@router.get("/auditories")
def get_eios_auditories(year: str = Query("2025-2026")):
    data = _fetch_eios("raspAudlist", {"year": year})
    if data and "data" in data:
        return data
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Не удалось загрузить список аудиторий с сервера ЭИОС КГУ")

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
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Не удалось загрузить расписание с сервера ЭИОС КГУ")
