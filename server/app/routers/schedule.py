from typing import Optional
from fastapi import APIRouter, Query
import requests

import app.core.security as security

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

EIOS_BASE_URL = "https://eios.kosgos.ru/api"

@router.get("/years")
def get_eios_years():
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/Rasp/ListYears", timeout=10, verify=security.VERIFY_SSL)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"data": {"years": ["2025-2026", "2024-2025"]}, "state": 1}

@router.get("/groups")
def get_eios_groups(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspGrouplist", params={"year": year}, timeout=10, verify=security.VERIFY_SSL)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"data": [], "error": "Не удалось загрузить список групп ЭИОС"}

@router.get("/teachers")
def get_eios_teachers(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspTeacherlist", params={"year": year}, timeout=10, verify=security.VERIFY_SSL)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"data": [], "error": "Не удалось загрузить список преподавателей ЭИОС"}

@router.get("/auditories")
def get_eios_auditories(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspAudlist", params={"year": year}, timeout=10, verify=security.VERIFY_SSL)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"data": [], "error": "Не удалось загрузить список аудиторий ЭИОС"}

@router.get("/rasp")
def get_eios_rasp(
    idGroup: Optional[int] = Query(None),
    idTeacher: Optional[int] = Query(None),
    idAud: Optional[int] = Query(None),
    year: str = Query("2025-2026"),
    sdate: Optional[str] = Query(None)
):
    try:
        params = {"year": year}
        if idGroup: params["idGroup"] = idGroup
        if idTeacher: params["idTeacher"] = idTeacher
        if idAud: params["idAud"] = idAud
        if sdate: params["sdate"] = sdate
        
        resp = requests.get(f"{EIOS_BASE_URL}/Rasp", params=params, timeout=15, verify=security.VERIFY_SSL)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"data": {"rasp": []}, "error": "Не удалось загрузить расписание ЭИОС"}
