"""EIOS timetable: a shared cache plus helpers for the calendar feed, teacher status and the assistant.

EIOS answers only with local Kostroma time (Moscow time, UTC+3, no daylight saving since 2014).
"""
import asyncio
import re
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from app.services import eios

MSK = timezone(timedelta(hours=3), "MSK")

LIST_TTL = 6 * 60 * 60
RASP_TTL = 10 * 60
# When EIOS is down the last real answer is served for up to a day, marked as stale.
STALE_TTL = 24 * 60 * 60
_MAX_CACHE_ENTRIES = 2000

_cache: Dict[Tuple, Tuple[float, Any]] = {}


class TimetableUnavailable(Exception):
    """EIOS did not answer and there is no saved copy to fall back on."""


def msk_now() -> datetime:
    return datetime.now(MSK)


def academic_year(day: date) -> str:
    """"2026-2027" from September 2026 to August 2027."""
    start = day.year if day.month >= 9 else day.year - 1
    return f"{start}-{start + 1}"


def clear_cache() -> None:
    _cache.clear()


async def cached(endpoint: str, params: dict, ttl: int) -> dict:
    """An EIOS answer from the cache, a fresh one, or a stale copy flagged {"stale": True}."""
    key = (endpoint, tuple(sorted(params.items())))
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]

    data = await eios.fetch_json(endpoint, params)
    # An empty timetable (holidays) is a valid answer; only a missing payload or failed state is an error.
    if isinstance(data, dict) and data.get("data") is not None and data.get("state", 1) == 1:
        if len(_cache) >= _MAX_CACHE_ENTRIES:
            _cache.pop(min(_cache, key=lambda k: _cache[k][0]))
        _cache[key] = (now, data)
        return data

    if hit and now - hit[0] < STALE_TTL:
        return {**hit[1], "stale": True, "cached_at": int(hit[0])}
    raise TimetableUnavailable()


# --- Lessons -----------------------------------------------------------------------------------

_KIND_PREFIX = re.compile(r"^(лек|лаб|пр)\.?\s+", re.IGNORECASE)
# EIOS writes the subgroup into the name ("пр Python, п/г 1", "(п/г 2)", "подгруппа 1") and only
# sometimes into номерПодгруппы
_SUBGROUP_IN_TITLE = re.compile(r"(?:п/г|подгр[а-яё]*)\.?\s*(\d)|(\d)\s*п/г", re.IGNORECASE)
_SUBGROUP_SUFFIX = re.compile(r"[\s,(]*(?:(?:п/г|подгр[а-яё]*)\.?\s*\d|\d\s*п/г)\s*\)?\s*$", re.IGNORECASE)
_TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})")


def clean_discipline(raw: str) -> str:
    """"лек Философия, п/г 1" → "Философия"."""
    text = _KIND_PREFIX.sub("", (raw or "").strip())
    return _SUBGROUP_SUFFIX.sub("", text).strip()


def subgroup_of(raw: str, field: Any) -> int:
    """0 for the whole group, else the subgroup number."""
    if isinstance(field, int) and not isinstance(field, bool) and field > 0:
        return field
    m = _SUBGROUP_IN_TITLE.search(raw or "")
    return int(m.group(1) or m.group(2)) if m else 0


def lesson_kind(raw: str) -> str:
    lower = (raw or "").lower()
    if lower.startswith("лек") or " лек " in lower:
        return "лекция"
    if lower.startswith("лаб") or " лаб " in lower:
        return "лабораторная"
    if lower.startswith("пр") or " пр " in lower:
        return "практика"
    if "экз" in lower:
        return "экзамен"
    if "зач" in lower:
        return "зачёт"
    if "конс" in lower:
        return "консультация"
    return "занятие"


@dataclass
class Lesson:
    day: date
    start: str  # "08:30"
    end: str
    discipline: str
    kind: str
    room: str
    teacher: str
    groups: List[str] = field(default_factory=list)
    subgroup: int = 0
    replaced: bool = False
    number: Optional[int] = None

    @property
    def starts_at(self) -> datetime:
        return _at(self.day, self.start)

    @property
    def ends_at(self) -> datetime:
        return _at(self.day, self.end)

    def as_dict(self) -> dict:
        return {
            "date": self.day.isoformat(),
            "start": self.start,
            "end": self.end,
            "discipline": self.discipline,
            "kind": self.kind,
            "room": self.room,
            "teacher": self.teacher,
            "groups": self.groups,
            "subgroup": self.subgroup,
            "replaced": self.replaced,
        }


def _at(day: date, hm: str) -> datetime:
    m = _TIME_RE.match(hm or "")
    hours, minutes = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
    return datetime(day.year, day.month, day.day, hours, minutes, tzinfo=MSK)


def _parse_day(value: Any) -> Optional[date]:
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def parse_lessons(payload: Any) -> List[Lesson]:
    """Lessons from an EIOS /Rasp answer, sorted, duplicates merged (one lesson taught to several groups)."""
    rows = payload.get("data", {}).get("rasp") if isinstance(payload, dict) and isinstance(payload.get("data"), dict) else None
    merged: Dict[tuple, Lesson] = {}
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        day = _parse_day(row.get("дата"))
        start, end = str(row.get("начало") or ""), str(row.get("конец") or "")
        if not day or not _TIME_RE.match(start) or not _TIME_RE.match(end):
            continue
        raw = str(row.get("дисциплина") or "")
        room = str(row.get("аудитория") or "").strip()
        teacher = str(row.get("преподаватель") or "").strip()
        subgroup = subgroup_of(raw, row.get("номерПодгруппы"))
        key = (day, start, end, raw, room, teacher, subgroup)
        group = str(row.get("группа") or "").strip()
        if key in merged:
            if group and group not in merged[key].groups:
                merged[key].groups.append(group)
            continue
        merged[key] = Lesson(
            day=day, start=start, end=end,
            discipline=clean_discipline(raw) or raw, kind=lesson_kind(raw),
            room=room, teacher=teacher, groups=[group] if group else [],
            subgroup=subgroup, replaced=bool(row.get("замена")),
            number=row.get("номерЗанятия") if isinstance(row.get("номерЗанятия"), int) else None,
        )
    return sorted(merged.values(), key=lambda l: (l.day, l.start, l.subgroup))


# --- Lookups -----------------------------------------------------------------------------------

def normalize_name(name: str) -> str:
    return " ".join((name or "").lower().replace("ё", "е").split())


async def find_group(name: str, year: str) -> Optional[dict]:
    """{"id", "name"} of a group in that academic year's list; group ids change every year, names do not."""
    wanted = normalize_name(name)
    payload = await cached("raspGrouplist", {"year": year}, LIST_TTL)
    for item in payload.get("data") or []:
        if isinstance(item, dict) and normalize_name(str(item.get("name") or "")) == wanted and item.get("id"):
            return {"id": int(item["id"]), "name": str(item["name"])}
    return None


async def group_lessons(group_id: int, year: str) -> Tuple[List[Lesson], bool]:
    """The group's whole-year timetable (the same request and cache entry as the schedule widget)."""
    payload = await cached("Rasp", {"year": year, "idGroup": group_id}, RASP_TTL)
    return parse_lessons(payload), bool(payload.get("stale"))


async def teacher_ids(year: str) -> Dict[str, List[int]]:
    payload = await cached("raspTeacherlist", {"year": year}, LIST_TTL)
    ids: Dict[str, List[int]] = {}
    for item in payload.get("data") or []:
        if isinstance(item, dict) and item.get("id") and item.get("name"):
            ids.setdefault(normalize_name(str(item["name"])), []).append(int(item["id"]))
    return ids


async def teacher_day(ids: Iterable[int], day: date) -> List[Lesson]:
    """One teacher's lessons on one day; several EIOS ids for the same name are merged."""
    year = academic_year(day)
    answers = await asyncio.gather(*(
        cached("Rasp", {"year": year, "idTeacher": tid, "sdate": day.isoformat()}, RASP_TTL) for tid in ids
    ))
    lessons: List[Lesson] = []
    for payload in answers:
        lessons.extend(lesson for lesson in parse_lessons(payload) if lesson.day == day)
    unique = {(l.start, l.end, l.discipline, l.room, l.subgroup): l for l in lessons}
    return sorted(unique.values(), key=lambda l: l.start)


def upcoming(lessons: Iterable[Lesson], now: datetime, days: int) -> List[Lesson]:
    """Lessons not yet over, up to `days` days ahead."""
    until = (now + timedelta(days=days)).date()
    return [l for l in lessons if l.ends_at > now and l.day <= until]
