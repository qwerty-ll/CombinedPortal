from datetime import datetime

from app.routers import calendar_feed
from app.services import eios, timetable

NOW = datetime(2026, 9, 24, 10, 15, tzinfo=timetable.MSK)  # Thursday


def lesson(day, start, end, discipline, room="Б-305", group="24-ИСбо-1", teacher="Иванов И.И.", **extra):
    return {"дата": f"{day}T00:00:00", "начало": start, "конец": end, "дисциплина": discipline,
            "аудитория": room, "группа": group, "преподаватель": teacher, "номерПодгруппы": 0, "замена": False, **extra}


GROUP_RASP = [
    lesson("2026-08-01", "08:30", "10:00", "лек Давно прошедшая пара"),
    lesson("2026-09-24", "08:30", "10:00", "лек Философия"),
    lesson("2026-09-24", "08:30", "10:00", "лек Философия", group="24-ИСбо-2"),
    lesson("2026-09-24", "10:10", "11:40", "пр Программирование на Python, п/г 1", room="Б-214", номерПодгруппы=1),
    lesson("2026-09-25", "13:40", "15:10", "лаб Базы данных; SQL, запросы", замена=True, номерЗанятия=3),
]


def fake_eios(monkeypatch, answers):
    """answers: {(endpoint, frozenset(params)): payload}; anything else fails like an unreachable EIOS."""
    calls = []

    async def fetch_json(endpoint, params, timeout=5.0):
        calls.append((endpoint, dict(params)))
        return answers.get((endpoint, frozenset(params.items())))

    monkeypatch.setattr(eios, "fetch_json", fetch_json)
    monkeypatch.setattr(timetable, "msk_now", lambda: NOW)
    return calls


def ok(data):
    return {"state": 1, "data": data}


GROUP_ANSWERS = {
    ("raspGrouplist", frozenset({"year": "2026-2027"}.items())): ok([{"id": 4242, "name": "24-ИСбо-1"}]),
    ("Rasp", frozenset({"year": "2026-2027", "idGroup": 4242}.items())): ok({"rasp": GROUP_RASP}),
}


def test_academic_year_turns_in_september():
    assert timetable.academic_year(datetime(2026, 8, 31).date()) == "2025-2026"
    assert timetable.academic_year(datetime(2026, 9, 1).date()) == "2026-2027"


def test_parse_lessons_merges_groups_and_cleans_titles():
    lessons = timetable.parse_lessons(ok({"rasp": GROUP_RASP}))
    philosophy = [l for l in lessons if l.discipline == "Философия"]
    assert len(philosophy) == 1 and philosophy[0].groups == ["24-ИСбо-1", "24-ИСбо-2"] and philosophy[0].kind == "лекция"
    python = next(l for l in lessons if l.subgroup == 1)
    assert python.discipline == "Программирование на Python" and python.kind == "практика"
    assert timetable.parse_lessons({"state": 1, "data": {"rasp": [{"дата": "bad"}]}}) == []


def test_group_calendar_feed(client, monkeypatch):
    calls = fake_eios(monkeypatch, GROUP_ANSWERS)
    r = client.get("/api/v1/calendar/group.ics", params={"name": " 24-исбо-1 "})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/calendar")
    body = r.text
    assert body.startswith("BEGIN:VCALENDAR\r\n") and body.endswith("END:VCALENDAR\r\n")
    assert all(len(line.encode()) <= 75 for line in body.split("\r\n"))
    unfolded = body.replace("\r\n ", "")
    assert "X-WR-CALNAME:Пары 24-ИСбо-1" in unfolded
    assert unfolded.count("BEGIN:VEVENT") == 3  # the August lesson is too old, the shared lecture counts once
    # 08:30 Moscow time is 05:30 UTC
    assert "DTSTART:20260924T053000Z\r\nDTEND:20260924T070000Z" in unfolded
    assert "SUMMARY:Программирование на Python (практика)\\, п/г 1" in unfolded
    assert "SUMMARY:Замена: Базы данных\\; SQL\\, запросы (лабораторная)" in unfolded
    assert "LOCATION:Б-214" in unfolded
    assert "DESCRIPTION:Преподаватель: Иванов И.И.\\n3-я пара\\nРасписание ЭИОС КГУ" in unfolded
    # UIDs stay the same between refreshes, so calendar apps update events instead of duplicating them
    again = client.get("/api/v1/calendar/group.ics", params={"name": "24-ИСбо-1"}).text
    uids = lambda text: [line for line in text.split("\r\n") if line.startswith("UID:")]
    assert uids(body) == uids(again)
    # The widget and the feed share one cached EIOS request
    assert [c for c in calls if c[0] == "Rasp"] == [("Rasp", {"year": "2026-2027", "idGroup": 4242})]


def test_group_calendar_errors(client, monkeypatch):
    fake_eios(monkeypatch, GROUP_ANSWERS)
    assert client.get("/api/v1/calendar/group.ics", params={"name": "99-XXбо-9"}).status_code == 404
    assert client.get("/api/v1/calendar/group.ics", params={"name": "<script>"}).status_code == 400
    timetable.clear_cache()
    fake_eios(monkeypatch, {})
    assert client.get("/api/v1/calendar/group.ics", params={"name": "24-ИСбо-1"}).status_code == 503


def test_fold_never_splits_a_character():
    lines = calendar_feed._fold("SUMMARY:" + "Ж" * 100)
    assert all(len(line.encode()) <= 75 for line in lines)
    assert "".join(line[1:] if i else line for i, line in enumerate(lines)) == "SUMMARY:" + "Ж" * 100


def test_teachers_today(client, monkeypatch, db):
    import app.models as models
    kiprina = db.query(models.Teacher).filter(models.Teacher.name == "Киприна Людмила Юрьевна").one()
    answers = {
        ("raspTeacherlist", frozenset({"year": "2026-2027"}.items())): ok([
            {"id": 11, "name": "Киприна  Людмила Юрьевна"},
            {"id": 12, "name": "Кто-то Совсем Другой"},
        ]),
        ("Rasp", frozenset({"year": "2026-2027", "idTeacher": 11, "sdate": "2026-09-24"}.items())): ok({"rasp": [
            lesson("2026-09-24", "10:10", "11:40", "лек Информатика", teacher="Киприна Л.Ю."),
            lesson("2026-09-24", "10:10", "11:40", "лек Информатика", group="24-ИСбо-2", teacher="Киприна Л.Ю."),
            lesson("2026-09-25", "08:30", "10:00", "пр Информатика", teacher="Киприна Л.Ю."),
        ]}),
    }
    fake_eios(monkeypatch, answers)
    r = client.get("/api/v1/schedule/teachers/today")
    assert r.status_code == 200
    data = r.json()
    assert data["date"] == "2026-09-24"
    assert data["teachers"] == {str(kiprina.id): [{
        "date": "2026-09-24", "start": "10:10", "end": "11:40", "discipline": "Информатика", "kind": "лекция",
        "room": "Б-305", "teacher": "Киприна Л.Ю.", "groups": ["24-ИСбо-1", "24-ИСбо-2"], "subgroup": 0, "replaced": False,
    }]}


def test_teachers_today_without_eios(client, monkeypatch):
    fake_eios(monkeypatch, {})
    assert client.get("/api/v1/schedule/teachers/today").status_code == 503
