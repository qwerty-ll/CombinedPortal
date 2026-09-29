"""Drafts of the documents ВИТШик prepares, filled in from the student's account and timetable."""
import re
from collections import Counter
from datetime import date, datetime, timedelta
from typing import List, Optional

import app.models as models
from app.services import documents, timetable

_MONTHS = {name[:3]: i + 1 for i, name in enumerate(documents.MONTHS_GENITIVE)}
_WEEKDAYS = [r"понедельник", r"вторник", r"\bсред[аеуы]\b", r"четверг", r"пятниц", r"суббот", r"воскресень"]


def parse_past_day(q: str, today: date) -> Optional[date]:
    """The day a student missed: "вчера", "в понедельник" (the last one), "24.09", "24 сентября"."""
    if "позавчера" in q:
        return today - timedelta(days=2)
    if "вчера" in q:
        return today - timedelta(days=1)
    if "сегодня" in q:
        return today
    m = re.search(r"\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b", q)
    if m:
        day, month = int(m.group(1)), int(m.group(2))
        year = int(m.group(3)) if m.group(3) else today.year
        year += 2000 if year < 100 else 0
        return _past_date(year, month, day, today, explicit_year=bool(m.group(3)))
    m = re.search(r"\b(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)", q)
    if m:
        month = _MONTHS.get(m.group(2)) or (5 if m.group(2).startswith("ма") else None)
        return _past_date(today.year, month, int(m.group(1)), today, explicit_year=False) if month else None
    monday = today - timedelta(days=today.weekday())
    for weekday, pattern in enumerate(_WEEKDAYS):
        if re.search(pattern, q):
            day = monday + timedelta(days=weekday)
            return day if day <= today else day - timedelta(days=7)
    return None


def _past_date(year: int, month: int, day: int, today: date, explicit_year: bool) -> Optional[date]:
    try:
        found = date(year, month, day)
    except ValueError:
        return None
    # "24.12" said in January means last December
    if not explicit_year and found > today + timedelta(days=7):
        found = found.replace(year=year - 1)
    return found


def explanatory_reason(q: str) -> str:
    if re.search(r"болел|болею|заболе|болезн|температур|простуд|грипп|ковид|орви", q):
        return "болезнь"
    if re.search(r"врач|поликлиник|больниц|стоматолог", q):
        return "посещение врача"
    if re.search(r"семейн", q):
        return "семейные обстоятельства"
    if re.search(r"соревнован|олимпиад|конференц|мероприят|хакатон", q):
        return "участие в мероприятии университета"
    return ""


def person_fields(user: models.User, today: date) -> dict:
    group = user.group_number or ""
    return {"full_name": user.full_name or "", "group": group, "course": documents.course_of(group, today)}


async def _group_lessons(user: models.User, day: date) -> List[timetable.Lesson]:
    if not user.group_number:
        return []
    year = timetable.academic_year(day)
    group = await timetable.find_group(user.group_number, year)
    if not group:
        return []
    lessons, _ = await timetable.group_lessons(group["id"], year)
    return lessons


async def pairs_on(user: models.User, day: date) -> List[dict]:
    """The group's pairs that day, for the list of missed classes."""
    return [
        {"start": l.start, "end": l.end, "discipline": l.discipline, "kind": l.kind,
         "teacher": l.teacher, "subgroup": l.subgroup}
        for l in await _group_lessons(user, day) if l.day == day
    ]


def _control_of(lessons: List[timetable.Lesson]) -> Optional[str]:
    kinds = {l.kind for l in lessons}
    if "экзамен" in kinds:
        return "экзамен"
    if "зачёт" in kinds:
        return "зачёт"
    return None


def _teacher_of(lessons: List[timetable.Lesson]) -> str:
    """Who takes the exam: the one who holds it, else the lecturer, else whoever teaches it most."""
    for kinds in (("экзамен", "зачёт"), ("лекция",)):
        teachers = [l.teacher for l in lessons if l.kind in kinds and l.teacher]
        if teachers:
            return Counter(teachers).most_common(1)[0][0]
    teachers = [l.teacher for l in lessons if l.teacher]
    return Counter(teachers).most_common(1)[0][0] if teachers else ""


async def disciplines_of(user: models.User, today: date) -> List[dict]:
    lessons = await _group_lessons(user, today)
    by_name = {}
    for lesson in lessons:
        by_name.setdefault(lesson.discipline, []).append(lesson)
    return [
        {"discipline": name, "teacher": _teacher_of(items), "control": _control_of(items)}
        for name, items in sorted(by_name.items())
    ]


async def explanatory_draft(user: models.User, q: str, now: datetime) -> dict:
    today = now.date()
    day = parse_past_day(q, today) or today
    try:
        pairs = await pairs_on(user, day)
    except timetable.TimetableUnavailable:
        pairs = []
    return {
        "kind": "explanatory",
        "fields": {
            **person_fields(user, today),
            "date_from": day.isoformat(),
            "date_to": None,
            "reason": explanatory_reason(q),
            "attachment": "",
            "pairs": [{**p, "checked": True} for p in pairs],
        },
        "options": {"reasons": documents.EXPLANATORY_REASONS},
    }


def retake_reason(q: str) -> str:
    if re.search(r"болел|не (пришел|пришла|явил|смог)|не был|пропустил", q):
        return documents.RETAKE_REASONS[1]
    return documents.RETAKE_REASONS[0]


def retake_control(q: str) -> Optional[str]:
    if "диф" in q:
        return "дифференцированный зачёт"
    if re.search(r"зач[её]т", q):
        return "зачёт"
    if "экз" in q:
        return "экзамен"
    return None


async def retake_draft(user: models.User, q: str, now: datetime, match) -> dict:
    """match(q, lessons) → names of the disciplines the question mentions (the assistant's matcher)."""
    today = now.date()
    try:
        options = await disciplines_of(user, today)
        lessons = await _group_lessons(user, today)
    except timetable.TimetableUnavailable:
        options, lessons = [], []
    named = match(q, lessons)
    chosen = next((o for o in options if named and o["discipline"] == named[0]), None)
    return {
        "kind": "retake",
        "fields": {
            **person_fields(user, today),
            "discipline": chosen["discipline"] if chosen else "",
            "control": retake_control(q) or (chosen or {}).get("control") or "экзамен",
            "teacher": chosen["teacher"] if chosen else "",
            "reason": retake_reason(q),
        },
        "options": {
            "disciplines": options,
            "controls": list(documents.CONTROL_GENITIVE),
            "reasons": documents.RETAKE_REASONS,
        },
    }
