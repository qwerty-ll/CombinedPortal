"""A group's timetable as an iCalendar feed that phone calendars subscribe to and refresh on their own."""
import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Iterable, List

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.services import timetable

router = APIRouter(prefix="/api/v1/calendar", tags=["Calendar"])

_GROUP_NAME_RE = re.compile(r"^[0-9A-Za-zА-Яа-яЁё][0-9A-Za-zА-Яа-яЁё .\-]{0,49}$")
# Lessons that ended longer ago than this are left out of the feed.
_KEEP_PAST = timedelta(days=14)
_UNAVAILABLE = "Расписание ЭИОС КГУ сейчас недоступно. Календарь обновится позже сам."


def _escape(text: str) -> str:
    return (text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
            .replace("\r\n", "\\n").replace("\n", "\\n"))


def _fold(line: str) -> List[str]:
    """RFC 5545: at most 75 octets per line, continuation lines start with a space; never split a UTF-8 character."""
    parts, current, size = [], "", 0
    for char in line:
        width = len(char.encode("utf-8"))
        limit = 75 if not parts else 74
        if size + width > limit:
            parts.append(current)
            current, size = "", 0
        current += char
        size += width
    parts.append(current)
    return [parts[0]] + [" " + part for part in parts[1:]]


def _utc(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _event(lesson: timetable.Lesson, group: str, stamp: str) -> List[str]:
    title = f"{lesson.discipline} ({lesson.kind})"
    if lesson.subgroup:
        title += f", п/г {lesson.subgroup}"
    if lesson.replaced:
        title = f"Замена: {title}"
    details = []
    if lesson.teacher:
        details.append(f"Преподаватель: {lesson.teacher}")
    if lesson.number:
        details.append(f"{lesson.number}-я пара")
    details.append("Расписание ЭИОС КГУ")
    uid_source = "|".join([group, lesson.day.isoformat(), lesson.start, lesson.end, lesson.discipline, lesson.kind, str(lesson.subgroup)])
    uid = hashlib.sha1(uid_source.encode("utf-8")).hexdigest()
    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}@portal-ivitsh",
        f"DTSTAMP:{stamp}",
        f"DTSTART:{_utc(lesson.starts_at)}",
        f"DTEND:{_utc(lesson.ends_at)}",
        f"SUMMARY:{_escape(title)}",
    ]
    if lesson.room:
        lines.append(f"LOCATION:{_escape(lesson.room)}")
    lines += [f"DESCRIPTION:{_escape(chr(10).join(details))}", "TRANSP:OPAQUE", "END:VEVENT"]
    return lines


def build_calendar(group: str, lessons: Iterable[timetable.Lesson], now: datetime) -> str:
    stamp = _utc(now)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Portal IVITSH KSU//Schedule//RU",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escape(f'Пары {group}')}",
        f"X-WR-CALDESC:{_escape(f'Расписание группы {group} из ЭИОС КГУ')}",
        "X-WR-TIMEZONE:Europe/Moscow",
        # How often calendar apps should re-read the feed; most take it as a hint
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        "X-PUBLISHED-TTL:PT6H",
    ]
    for lesson in lessons:
        if lesson.ends_at >= now - _KEEP_PAST:
            lines += _event(lesson, group, stamp)
    lines.append("END:VCALENDAR")
    return "".join(folded + "\r\n" for line in lines for folded in _fold(line))


@router.get("/group.ics")
async def group_calendar(name: str = Query(..., max_length=50)):
    name = " ".join(name.split())
    if not _GROUP_NAME_RE.match(name):
        raise HTTPException(status_code=400, detail="Неверное название группы")

    now = timetable.msk_now()
    this_year = timetable.academic_year(now.date())
    try:
        year, group = this_year, await timetable.find_group(name, this_year)
    except timetable.TimetableUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)
    if group is None:
        # Over the summer the new year's list may not have the group yet
        year = timetable.academic_year(now.date() - timedelta(days=365))
        try:
            group = await timetable.find_group(name, year)
        except timetable.TimetableUnavailable:
            group = None
    if group is None:
        raise HTTPException(status_code=404, detail=f"Группа «{name}» не найдена в расписании ЭИОС")
    try:
        lessons, _ = await timetable.group_lessons(group["id"], year)
    except timetable.TimetableUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)

    return Response(
        content=build_calendar(group["name"], lessons, now),
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": 'inline; filename="schedule.ics"',
            "Cache-Control": "public, max-age=900",
        },
    )
