"""ВИТШик: answers from the portal's own data, the student's timetable, rooms, teachers, FAQ and the forum.

Facts computed from data (lessons, rooms, where a teacher is now) are shown exactly as computed and never
go through the language model, so times and rooms cannot be made up. GigaChat only rephrases answers
found in the FAQ, the forum and the knowledge base, and only for signed-in students.
"""
import html
import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from urllib.parse import quote

from sqlalchemy.orm import Session, selectinload

import app.models as models
from app.services import rag_service, timetable

logger = logging.getLogger("ivitsh_portal.assistant")

LOOKAHEAD_DAYS = 14
MAX_ACTIONS = 3
# The newest threads are searched; older ones are still on the forum itself
FORUM_SEARCH_LIMIT = 300
WEEKDAY_AT = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"]
# Rooms that have their own highlighted floor plan in /public
ROOM_IMAGES = {
    "101", "102", "104", "107", "108", "201", "202", "203", "204", "206", "207", "208", "209",
    "301", "302", "303", "304", "306", "307", "308", "309", "310", "312", "313",
    "401", "403", "406", "407", "408", "409",
}

NOT_FOUND_REPLY = (
    "Не нашёл ответа ни в частых вопросах, ни на форуме. Задай вопрос на форуме: там отвечают "
    "старшекурсники и кураторы. А про пары, аудитории и преподавателей спрашивай меня."
)


@dataclass
class Action:
    label: str
    to: str


@dataclass
class Finding:
    text: str
    actions: List[Action] = field(default_factory=list)
    # Computed from data: shown as is, never rephrased by the language model
    exact: bool = False
    weight: int = 0


def _norm(text: str) -> str:
    return (text or "").lower().replace("ё", "е")


def _words(text: str) -> List[str]:
    return re.findall(r"[a-zа-я0-9]+", _norm(text))


def _stem(word: str) -> str:
    """A crude Russian stem: enough to match "философию" with "Философия"."""
    return word[:min(6, max(3, len(word) - 2))]


_STOP = {_stem(w) for w in (
    "как где что когда какой какая какие какую каком мне меня мой моя мои нас наш наша это есть будет будут "
    "для или про при там тут все всех надо нужно можно можешь скажи подскажи расскажи пожалуйста спасибо привет "
    "сегодня завтра послезавтра неделе неделю пара пары пару парой занятие занятия лекция практика лабораторная "
    "аудитория аудитории кабинет корпус этаж идет идти сейчас следующая следующий ближайшая ближайший"
).split()}
_GENERIC_DISCIPLINE = {_stem(w) for w in "основы основ введение теория курс модуль дисциплина".split()}


def _content_stems(text: str) -> set:
    return {_stem(w) for w in _words(text) if len(w) >= 3 and not w.isdigit()} - _STOP


def _strip_html(text: str) -> str:
    text = re.sub(r"<\s*(br|/p|/li|/div|/h\d)\s*/?>", "\n", text or "", flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.IGNORECASE)
    text = html.unescape(re.sub(r"<[^>]+>", "", text))
    return re.sub(r"\n{3,}", "\n\n", "\n".join(line.strip() for line in text.splitlines())).strip()


def _excerpt(text: str, limit: int = 420) -> str:
    text = _strip_html(text)
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"


def _link(path: str, **params: str) -> str:
    return path + "?" + "&".join(f"{key}={quote(value)}" for key, value in params.items()) if params else path


def _map_action(room: str) -> Optional[Action]:
    m = re.match(r"^Б-?([1-4]\d{2})$", (room or "").strip(), re.IGNORECASE)
    return Action(f"Б-{m.group(1)} на карте", _link("/map", room=f"Б-{m.group(1)}")) if m else None


# --- Dates in questions ------------------------------------------------------------------------

_WEEKDAYS = [
    (0, r"понедельник"), (1, r"вторник"), (2, r"\bсред[аеуы]\b"), (3, r"четверг"),
    (4, r"пятниц"), (5, r"суббот"), (6, r"воскресень"),
]


def parse_when(q: str, today: date) -> Optional[Tuple[date, date]]:
    """The day range a question is about: "завтра", "в пятницу", "на этой неделе"…"""
    if "послезавтра" in q:
        day = today + timedelta(days=2)
        return day, day
    if "завтра" in q:
        day = today + timedelta(days=1)
        return day, day
    if "сегодня" in q:
        return today, today
    monday = today - timedelta(days=today.weekday())
    if re.search(r"следующ\w* недел|след\.? недел", q):
        return monday + timedelta(days=7), monday + timedelta(days=13)
    for weekday, pattern in _WEEKDAYS:
        if re.search(pattern, q):
            day = monday + timedelta(days=weekday)
            if day < today or re.search(r"следующ\w* " + pattern, q):
                day += timedelta(days=7)
            return day, day
    if re.search(r"(эт\w+|на) недел", q):
        return today, monday + timedelta(days=6)
    return None


def _day_label(day: date, today: date) -> str:
    if day == today:
        return "сегодня"
    if day == today + timedelta(days=1):
        return "завтра"
    return f"{WEEKDAY_AT[day.weekday()]}, {day:%d.%m}"


def _whose(lesson: timetable.Lesson) -> str:
    return f" у {lesson.subgroup} подгруппы" if lesson.subgroup else ""


def _by_subgroup(lessons: List[timetable.Lesson]) -> str:
    """"1 подгруппа — Python (практика), Б-214; 2 подгруппа — Базы данных (лабораторная), Б-407"."""
    return "; ".join(
        f"{f'{l.subgroup} подгруппа' if l.subgroup else 'вся группа'} — {l.discipline} ({l.kind})" + (f", {l.room}" if l.room else "")
        for l in sorted(lessons, key=lambda l: l.subgroup)
    )


def _lesson_line(lesson: timetable.Lesson) -> str:
    parts = [f"{lesson.start}–{lesson.end}", f"{lesson.discipline} ({lesson.kind})"]
    if lesson.room:
        parts.append(lesson.room)
    if lesson.subgroup:
        parts.append(f"{lesson.subgroup} подгруппа")
    if lesson.replaced:
        parts.append("замена")
    return " · ".join(parts)


# --- Timetable ---------------------------------------------------------------------------------

_PAIR_WORDS = re.compile(
    r"\bпар(а|ы|у|е|ой|ами|ах|ам)?\b|заняти|расписани|лекци|практик|семинар|\bлаб|экзамен|зачет|консультац"
)
_ASKS_WHAT = re.compile(r"\b(что|какие|какая|какой|есть ли|есть|во сколько|у нас|у меня|куда)\b")


def _asks_schedule(q: str, today: date) -> bool:
    return bool(_PAIR_WORDS.search(q) or (parse_when(q, today) and _ASKS_WHAT.search(q)) or re.search(r"куда (мне )?идти|где у меня", q))


def _matching_disciplines(q: str, lessons: List[timetable.Lesson]) -> List[str]:
    asked = _content_stems(q)
    scores = {}
    for lesson in lessons:
        stems = _content_stems(lesson.discipline) - _GENERIC_DISCIPLINE
        score = len(asked & stems)
        if score:
            scores[lesson.discipline] = max(score, scores.get(lesson.discipline, 0))
    if not scores:
        return []
    best = max(scores.values())
    return [name for name, score in scores.items() if score == best][:3]


async def _group_for(user: Optional[models.User], hint: Optional[str], year: str) -> Tuple[Optional[dict], Optional[str]]:
    """The student's own group, else the group picked on the dashboard; (group, name that was not found)."""
    missing = None
    for name in (user.group_number if user else None, hint):
        if name and name.strip():
            group = await timetable.find_group(name, year)
            if group:
                return group, None
            missing = missing or name.strip()
    return None, missing


def _schedule_answer(q: str, lessons: List[timetable.Lesson], group: str, now: datetime) -> Finding:
    today = now.date()
    soon = timetable.upcoming(lessons, now, LOOKAHEAD_DAYS)
    when = parse_when(q, today)
    disciplines = _matching_disciplines(q, soon)
    actions = [Action("Расписание на главной", "/#schedule-section")]

    def finish(text: str, focus: Optional[timetable.Lesson]) -> Finding:
        room = _map_action(focus.room) if focus else None
        return Finding(text=text, actions=([room] if room else []) + actions, exact=True, weight=100)

    if disciplines:
        pool = [l for l in soon if l.discipline in disciplines and (not when or when[0] <= l.day <= when[1])]
        title = ", ".join(f"«{d}»" for d in disciplines)
        if not pool:
            where = f" {_day_label(when[0], today)}" if when and when[0] == when[1] else (" в эти дни" if when else " в ближайшие две недели")
            return finish(f"{title}{where} в расписании группы {group} нет.", None)
        lines = [f"• {_day_label(l.day, today)}, {_lesson_line(l)}" for l in pool[:4]]
        return finish(f"{title} у группы {group}:\n" + "\n".join(lines), pool[0])

    if when:
        first, last = when
        pool = [l for l in lessons if first <= l.day <= last and l.ends_at > now - timedelta(hours=12)]
        if first == last:
            label = _day_label(first, today)
            if not pool:
                return finish(f"{label.capitalize()} у группы {group} пар нет.", None)
            lines = [f"• {_lesson_line(l)}" + (" · сейчас" if l.starts_at <= now < l.ends_at else "") for l in pool]
            return finish(f"{label.capitalize()} у группы {group}:\n" + "\n".join(lines), next((l for l in pool if l.ends_at > now), None))
        if not pool:
            return finish(f"В эти дни у группы {group} пар нет.", None)
        lines, current_day = [], None
        for lesson in pool[:14]:
            if lesson.day != current_day:
                current_day = lesson.day
                lines.append(_day_label(lesson.day, today).capitalize() + ":")
            lines.append(f"• {_lesson_line(lesson)}")
        return finish(f"Пары группы {group}:\n" + "\n".join(lines), next((l for l in pool if l.ends_at > now), None))

    current = [l for l in soon if l.starts_at <= now < l.ends_at]
    upcoming = [l for l in soon if l.starts_at > now]
    # Subgroups can have different pairs at the same time: name them all
    current = [l for l in current if l.starts_at == current[0].starts_at] if current else []
    upcoming = [l for l in upcoming if l.starts_at == upcoming[0].starts_at] if upcoming else []
    parts = []
    if current:
        c = current[0]
        if len(current) > 1:
            parts.append(f"Сейчас идут пары по подгруппам, до {c.end}: {_by_subgroup(current)}.")
        else:
            parts.append(f"Сейчас идёт {c.discipline} ({c.kind}){_whose(c)}" + (f" в {c.room}" if c.room else "") + f", до {c.end}.")
    if upcoming:
        n = upcoming[0]
        if not current and n.day != today and any(l.day == today for l in lessons):
            parts.append("На сегодня пары закончились.")
        when = f"{_day_label(n.day, today)} в {n.start}"
        if len(upcoming) > 1:
            parts.append(f"Следующая пара — {when}, по подгруппам: {_by_subgroup(upcoming)}.")
        else:
            parts.append(f"Следующая пара — {when}: {n.discipline} ({n.kind}){_whose(n)}" + (f", {n.room}" if n.room else "") + ".")
    if not parts:
        return finish(f"В ближайшие две недели у группы {group} пар в расписании нет.", None)
    return finish(" ".join(parts), current[0] if current else upcoming[0])


async def _schedule_finding(q, previous_q, user, hint, now) -> Optional[Finding]:
    today = now.date()
    # "А завтра?" right after a question about pairs is a question about pairs too
    asked = _asks_schedule(q, today) or bool(parse_when(q, today) and previous_q and _asks_schedule(previous_q, today))
    has_group = bool((user and user.group_number) or hint)
    if not asked and not has_group:
        return None
    try:
        year = timetable.academic_year(today)
        group, missing = await _group_for(user, hint, year)
        lessons, stale = (await timetable.group_lessons(group["id"], year)) if group else ([], False)
    except timetable.TimetableUnavailable:
        if not asked:
            return None
        return Finding("ЭИОС сейчас не отвечает, и расписание я не вижу. Попробуй чуть позже.", [Action("Расписание на главной", "/#schedule-section")], exact=True, weight=100)

    # A discipline named without any "пара"/"когда" word still counts: «философия на этой неделе?»
    if not asked and not (group and _matching_disciplines(q, timetable.upcoming(lessons, now, LOOKAHEAD_DAYS))):
        return None
    if not group:
        if missing:
            text = f"Не нашёл группу «{missing}» в расписании ЭИОС на этот учебный год. Выбери группу в расписании на главной."
            return Finding(text, [Action("Расписание на главной", "/#schedule-section")], exact=True, weight=100)
        text = "Я пока не знаю твою группу. Войди через ЭИОС в «Личном кабинете» или выбери группу в расписании на главной, и я подскажу пары."
        return Finding(text, [Action("Войти через ЭИОС", "/profile"), Action("Расписание на главной", "/#schedule-section")], exact=True, weight=100)

    finding = _schedule_answer(q, lessons, group["name"], now)
    if stale:
        finding.text += "\n\nЭИОС сейчас не отвечает, это последнее сохранённое расписание."
    return finding


# --- Rooms -------------------------------------------------------------------------------------

_ROOM_RE = re.compile(r"(?:^|[^\d])(?:б|b)?\s*-?\s*([1-4])(0[1-9]|1\d|20)(?!\d)")


def room_finding(q: str) -> Optional[Finding]:
    if "коворкинг" in q:
        return Finding(
            "Коворкинг ВИТШ — на 4 этаже корпуса Б (ул. Ивановская, 24а). Там можно заниматься между парами.\n\n[IMG:coworking.png]",
            [Action("4 этаж на карте", _link("/map", room="Б-401"))], exact=True, weight=90,
        )
    m = _ROOM_RE.search(q)
    if m:
        floor, number = m.group(1), m.group(1) + m.group(2)
    elif re.search(r"дирекци|деканат", q):
        floor, number = "2", "209"
    else:
        return None
    note = " (дирекция ИВИТШ)" if number == "209" else ""
    if number in ROOM_IMAGES:
        text = f"Аудитория Б-{number}{note} — на {floor} этаже корпуса Б (ул. Ивановская, 24а). На схеме этажа она выделена.\n\n[IMG:{number}.png]"
    else:
        text = f"Аудитория Б-{number} — на {floor} этаже корпуса Б (ул. Ивановская, 24а). Вот схема этажа.\n\n[IMG:floor{floor}.png]"
    return Finding(text, [Action("Открыть на карте", _link("/map", room=f"Б-{number}"))], exact=True, weight=90)


# --- Teachers ----------------------------------------------------------------------------------

def _surname_stem(name: str) -> str:
    """The unchanging part of a surname: "Киприна" → "киприн" (Киприной), "Иваницкий" → "иваницк"."""
    surname = _norm(name).split()[0] if name.strip() else ""
    if surname.endswith(("ий", "ый", "ой", "ая", "ок", "ек")):
        return surname[:-2]
    if surname.endswith(("а", "я")):
        return surname[:-1]
    return surname


def _is_female(name: str) -> bool:
    parts = _norm(name).split()
    return len(parts) >= 3 and parts[2].endswith(("вна", "чна", "кызы"))


def teacher_status(teacher: models.Teacher, lessons: List[timetable.Lesson], now: datetime) -> Tuple[str, Optional[timetable.Lesson]]:
    current = next((l for l in lessons if l.starts_at <= now < l.ends_at), None)
    if current:
        where = f" в {current.room}" if current.room else ""
        return f"Сейчас ведёт пару «{current.discipline}»{where}, до {current.end}.", current
    later = next((l for l in lessons if l.starts_at > now), None)
    if later:
        free = "свободна" if _is_female(teacher.name) else "свободен"
        where = f" в {later.room}" if later.room else ""
        return f"Сейчас {free}, следующая пара в {later.start}{where}.", later
    if lessons:
        return "Пары на сегодня закончились.", None
    return "Сегодня пар по расписанию нет.", None


async def _teacher_finding(q: str, db: Session, now: datetime) -> Optional[Finding]:
    words = _words(q)
    matched = [
        t for t in db.query(models.Teacher).all()
        if (stem := _surname_stem(t.name)) and len(stem) >= 4 and any(w.startswith(stem) for w in words)
    ][:3]
    if not matched:
        return None
    try:
        ids = await timetable.teacher_ids(timetable.academic_year(now.date()))
    except timetable.TimetableUnavailable:
        ids = {}

    blocks, actions = [], []
    for teacher in matched:
        role = f" — {teacher.role[:1].lower() + teacher.role[1:]}" if teacher.role else ""
        facts = [f"**{teacher.name}**{role}."]
        if teacher.office:
            facts.append(f"Кабинет: {teacher.office}.")
        if teacher.email:
            facts.append(f"E-mail: {teacher.email}")
        eios_ids = ids.get(timetable.normalize_name(teacher.name))
        if eios_ids:
            try:
                status, lesson = teacher_status(teacher, await timetable.teacher_day(eios_ids, now.date()), now)
                facts.append(status)
                room = _map_action(lesson.room) if lesson else None
                if room:
                    actions.append(room)
            except timetable.TimetableUnavailable:
                pass
        blocks.append("\n".join(facts))
        actions.append(Action("Карточка преподавателя", _link("/teachers", q=teacher.name.split()[0])))
    return Finding("\n\n".join(blocks), actions, exact=True, weight=80)


# --- FAQ, forum, knowledge base ----------------------------------------------------------------

def _score(asked: set, title: str, body: str) -> int:
    in_title = len(asked & _content_stems(title))
    return in_title * 3 + len(asked & _content_stems(body)) if in_title else 0


def _faq_findings(q: str, db: Session) -> List[Finding]:
    asked = _content_stems(q)
    if not asked:
        return []
    findings = []
    for item in db.query(models.FaqItem).all():
        score = _score(asked, item.question, _strip_html(item.answer))
        if score >= 3:
            text = f"{item.question}\n{_excerpt(item.answer, 700)}"
            findings.append(Finding(text, [Action("Открыть в частых вопросах", _link("/faq", q=item.question[:60]))], weight=score + 2))
    return sorted(findings, key=lambda f: -f.weight)[:2]


def _forum_findings(q: str, db: Session) -> List[Finding]:
    asked = _content_stems(q)
    if not asked:
        return []
    findings = []
    recent = (
        db.query(models.ForumQuestion)
        .options(selectinload(models.ForumQuestion.answers))
        .order_by(models.ForumQuestion.created_at.desc())
        .limit(FORUM_SEARCH_LIMIT)
    )
    for question in recent:
        answers = sorted(question.answers, key=lambda a: (not a.is_solution, a.created_at))
        if not answers:
            continue
        score = _score(asked, question.title, question.content)
        if score >= 3:
            text = f"На форуме это обсуждали: «{question.title}». Ответ: {_excerpt(answers[0].content)}"
            findings.append(Finding(text, [Action("Открыть обсуждение", f"/forum/question/{question.id}")], weight=score))
    return sorted(findings, key=lambda f: -f.weight)[:2]


def _knowledge_finding(q: str) -> Optional[Finding]:
    score, chunk = rag_service.evaluate_query(q)
    if score < 4 or not chunk:
        return None
    return Finding(chunk["content"], weight=score)


# --- Answer ------------------------------------------------------------------------------------

def _merge_actions(findings: List[Finding]) -> List[Action]:
    seen, merged = set(), []
    for finding in findings:
        for action in finding.actions:
            if action.to not in seen:
                seen.add(action.to)
                merged.append(action)
    return merged[:MAX_ACTIONS]


def _system_prompt(facts: List[Finding], now: datetime) -> str:
    joined = "\n---\n".join(f.text for f in facts)
    return (
        "Ты — ВИТШик, котик-помощник студентов Высшей ИТ-школы КГУ. Обращайся на «ты», дружелюбно и коротко.\n\n"
        "ПРАВИЛА:\n"
        "1. Отвечай ТОЛЬКО по фактам ниже, 1–4 предложения. Ничего не добавляй от себя.\n"
        "2. Если в фактах нет ответа, честно скажи, что не знаешь, и посоветуй спросить на форуме портала.\n"
        "3. Сохраняй теги изображений вида [IMG:...] без изменений. Не пиши других тегов.\n\n"
        f"Сейчас {now:%d.%m.%Y %H:%M} по Москве.\n\n"
        f"Факты:\n{joined}"
    )


async def answer(
    message: str,
    history: list,
    user: Optional[models.User],
    db: Session,
    group_hint: Optional[str] = None,
    use_llm: bool = True,
) -> Tuple[str, List[Action]]:
    q = _norm(message).strip()
    previous_q = next((_norm(t.get("content", "")) for t in reversed(history or []) if t.get("role") == "user"), "")
    now = timetable.msk_now()

    exact = [f for f in (
        await _schedule_finding(q, previous_q, user, group_hint, now),
        room_finding(q),
        await _teacher_finding(q, db, now),
    ) if f]
    if exact:
        shown = sorted(exact, key=lambda f: -f.weight)[:2]
        return "\n\n".join(f.text for f in shown), _merge_actions(shown)

    found = _faq_findings(q, db) + _forum_findings(q, db)
    knowledge = _knowledge_finding(q)
    if knowledge:
        found.append(knowledge)
    if not found:
        return NOT_FOUND_REPLY, [Action("Спросить на форуме", "/forum")]
    found.sort(key=lambda f: -f.weight)
    best = found[0]

    if use_llm and rag_service.is_llm_configured():
        try:
            reply = await rag_service.ask_gigachat(_system_prompt(found[:3], now), history, message)
            image = re.search(r"\[IMG:[^\]]+\]", best.text)
            if image and image.group(0) not in reply:
                reply = f"{reply}\n\n{image.group(0)}"
            if reply:
                return reply, _merge_actions(found)
        except Exception as e:
            logger.warning("GigaChat unavailable, answering from portal data: %s", e)
    return best.text, _merge_actions(found)
