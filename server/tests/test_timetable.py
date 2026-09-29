from datetime import datetime

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


def test_subgroup_comes_from_the_name_when_the_field_is_empty():
    rows = [
        lesson("2026-09-24", "10:10", "11:40", "пр Python для ИИ (ТЭК, АПК), п/г 1"),
        lesson("2026-09-24", "10:10", "11:40", "лаб Базы данных (п/г 2)", room="Б-407"),
        lesson("2026-09-24", "11:50", "13:20", "лаб ОС, подгруппа 2"),
        lesson("2026-09-24", "13:40", "15:10", "лек Философия", номерПодгруппы=0),
        lesson("2026-09-24", "15:20", "16:50", "пр Физика", номерПодгруппы=1),
    ]
    parsed = [(l.discipline, l.subgroup) for l in timetable.parse_lessons(ok({"rasp": rows}))]
    assert parsed == [
        ("Python для ИИ (ТЭК, АПК)", 1), ("Базы данных", 2), ("ОС", 2), ("Философия", 0), ("Физика", 1),
    ]


def test_session_prefixes_are_stripped():
    rows = [lesson("2026-12-24", "10:10", "11:40", "экз Философия"), lesson("2026-12-20", "10:10", "11:40", "конс Философия")]
    assert [(l.discipline, l.kind) for l in timetable.parse_lessons(ok({"rasp": rows}))] == [
        ("Философия", "консультация"), ("Философия", "экзамен"),
    ]
