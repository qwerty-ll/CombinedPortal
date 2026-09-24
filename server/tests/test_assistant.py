from datetime import date, datetime
from urllib.parse import unquote

import pytest

import app.models as models
from app.services import assistant, eios, rag_service, timetable
from conftest import CSRF, login_student

NOW = datetime(2026, 9, 24, 10, 15, tzinfo=timetable.MSK)  # Thursday, during the second pair


def lesson(day, start, end, discipline, room="Б-305", teacher="Иванов И.И.", **extra):
    return {"дата": f"{day}T00:00:00", "начало": start, "конец": end, "дисциплина": discipline, "аудитория": room,
            "группа": "24-ИСбо-1", "преподаватель": teacher, "номерПодгруппы": 0, "замена": False, **extra}


def ok(data):
    return {"state": 1, "data": data}


ANSWERS = {
    ("raspGrouplist", frozenset({"year": "2026-2027"}.items())): ok([{"id": 4242, "name": "24-ИСбо-1"}]),
    ("Rasp", frozenset({"year": "2026-2027", "idGroup": 4242}.items())): ok({"rasp": [
        lesson("2026-09-24", "08:30", "10:00", "лек Философия"),
        lesson("2026-09-24", "10:10", "11:40", "пр Программирование на Python", room="Б-214"),
        lesson("2026-09-25", "13:40", "15:10", "лаб Базы данных", room="Б-407", замена=True),
        lesson("2026-09-28", "08:30", "10:00", "лек Философия"),
    ]}),
    ("raspTeacherlist", frozenset({"year": "2026-2027"}.items())): ok([{"id": 11, "name": "Киприна Людмила Юрьевна"}]),
    ("Rasp", frozenset({"year": "2026-2027", "idTeacher": 11, "sdate": "2026-09-24"}.items())): ok({"rasp": [
        lesson("2026-09-24", "10:10", "11:40", "лек Информатика", room="Б-305", teacher="Киприна Л.Ю."),
    ]}),
}


@pytest.fixture
def fake_timetable(monkeypatch):
    async def fetch_json(endpoint, params, timeout=5.0):
        return ANSWERS.get((endpoint, frozenset(params.items())))

    monkeypatch.setattr(eios, "fetch_json", fetch_json)
    monkeypatch.setattr(timetable, "msk_now", lambda: NOW)


def ask(client, message, **extra):
    r = client.post("/api/v1/chat", json={"message": message, **extra}, headers=CSRF)
    assert r.status_code == 200, r.text
    data = r.json()
    return data["reply"], [(a["label"], unquote(a["to"])) for a in data["actions"]]


@pytest.fixture
def student(app, fake_eios, fake_timetable):
    return login_student(app, fake_eios, group="24-ИСбо-1")


def test_next_pair_is_computed_from_the_timetable(student):
    reply, actions = ask(student, "Где у меня следующая пара?")
    assert reply == (
        "Сейчас идёт Программирование на Python (практика) в Б-214, до 11:40. "
        "Следующая пара — завтра в 13:40: Базы данных (лабораторная), Б-407."
    )
    assert ("Б-214 на карте", "/map?room=Б-214") in actions and ("Расписание на главной", "/") in actions


def test_pairs_on_a_day_and_follow_up(student):
    reply, _ = ask(student, "Какие пары завтра?")
    assert reply == "Завтра у группы 24-ИСбо-1:\n• 13:40–15:10 · Базы данных (лабораторная) · Б-407 · замена"
    reply, _ = ask(student, "а в понедельник?", history=[{"role": "user", "content": "Какие пары завтра?"}])
    assert reply.startswith("В понедельник, 28.09 у группы 24-ИСбо-1:") and "Философия" in reply
    reply, _ = ask(student, "Что сегодня?")
    assert "• 10:10–11:40 · Программирование на Python (практика) · Б-214 · сейчас" in reply


def test_when_is_a_discipline(student):
    reply, actions = ask(student, "Когда философия?")
    assert reply == "«Философия» у группы 24-ИСбо-1:\n• в понедельник, 28.09, 08:30–10:00 · Философия (лекция) · Б-305"
    assert ("Б-305 на карте", "/map?room=Б-305") in actions
    reply, _ = ask(student, "Философия на этой неделе будет?")
    assert reply == "«Философия» в эти дни в расписании группы 24-ИСбо-1 нет."


def test_guest_needs_a_group(client, fake_timetable):
    reply, actions = ask(client, "Какая следующая пара?")
    assert reply.startswith("Я пока не знаю твою группу")
    assert ("Войти через ЭИОС", "/profile") in actions
    reply, _ = ask(client, "Какая следующая пара?", group="24-ИСбо-1")
    assert reply.startswith("Сейчас идёт Программирование на Python")
    reply, _ = ask(client, "Какая следующая пара?", group="99-XX-9")
    assert reply.startswith("Не нашёл группу «99-XX-9»")


def test_rooms(client, fake_timetable):
    reply, actions = ask(client, "Как дойти до Б-407?")
    assert "на 4 этаже корпуса Б" in reply and reply.endswith("[IMG:407.png]")
    assert actions == [("Открыть на карте", "/map?room=Б-407")]
    reply, _ = ask(client, "где аудитория 305")
    assert "на 3 этаже" in reply and reply.endswith("[IMG:floor3.png]")
    reply, _ = ask(client, "Где дирекция?")
    assert "Б-209 (дирекция ИВИТШ)" in reply
    # Money and years are not rooms
    assert "этаже" not in ask(client, "стипендия 4500 рублей в 2026 году")[0]


def test_where_is_a_teacher_now(client, fake_timetable):
    reply, actions = ask(client, "Где сейчас Киприна?")
    assert reply.startswith("Киприна Людмила Юрьевна — заведующая кафедрой")
    assert "Сейчас ведёт пару «Информатика» в Б-305, до 11:40." in reply
    assert ("Карточка преподавателя", "/teachers?q=Киприна") in actions
    assert ask(client, "как найти Киприной кабинет")[0].startswith("Киприна Людмила Юрьевна")
    # "логином" must not be taken for Логинова
    assert "Логинова" not in ask(client, "как войти с логином?")[0]


def test_faq_forum_and_not_found(client, fake_timetable, db, app, fake_eios):
    db.add(models.FaqItem(question="Что делать, если потерял студенческий билет?",
                          answer="<p>Напиши заявление в дирекции <b>Б-209</b>.</p><ul><li>Возьми паспорт</li></ul>"))
    db.commit()
    reply, actions = ask(client, "что делать если потерял студенческий?")
    assert reply.startswith("Что делать, если потерял студенческий билет?\nНапиши заявление в дирекции Б-209.")
    assert "• Возьми паспорт" in reply
    assert actions[0][1] == "/faq?q=Что делать, если потерял студенческий билет?"

    author = db.query(models.User).first() or models.User(username="u1", full_name="U", hashed_password="x")
    db.add(author)
    db.flush()
    question = models.ForumQuestion(author_id=author.id, title="Где взять справку об обучении для военкомата?", content="Нужна справка")
    db.add(question)
    db.flush()
    db.add(models.ForumAnswer(question_id=question.id, author_id=author.id, content="В отделе кадров, окно 3.", is_solution=True))
    db.commit()
    reply, actions = ask(client, "как получить справку для военкомата")
    assert "«Где взять справку об обучении для военкомата?»" in reply and "В отделе кадров, окно 3." in reply
    assert actions == [("Открыть обсуждение", f"/forum/question/{question.id}")]

    reply, actions = ask(client, "как настроить принтер в общежитии")
    assert reply == assistant.NOT_FOUND_REPLY and actions == [("Спросить на форуме", "/forum")]


def test_llm_rephrases_only_found_texts(student, monkeypatch):
    prompts = []

    async def fake_llm(system_prompt, history, message, max_tokens=350):
        prompts.append(system_prompt)
        return "Стипендия за отличную сессию — 4500 рублей."

    monkeypatch.setattr(rag_service, "ask_gigachat", fake_llm)
    monkeypatch.setattr(rag_service.settings, "GIGACHAT_AUTH_KEY", "configured")
    assert ask(student, "Какая стипендия за отличную сессию?")[0] == "Стипендия за отличную сессию — 4500 рублей."
    assert "4500 руб" in prompts[0] and "24.09.2026 10:15" in prompts[0]
    # Times and rooms never go through the model
    assert ask(student, "Где у меня следующая пара?")[0].startswith("Сейчас идёт")
    assert len(prompts) == 1


def test_llm_failure_falls_back_to_the_found_text(student, monkeypatch):
    async def broken(*args, **kwargs):
        raise RuntimeError("down")

    monkeypatch.setattr(rag_service, "ask_gigachat", broken)
    monkeypatch.setattr(rag_service.settings, "GIGACHAT_AUTH_KEY", "configured")
    assert "4500 руб" in ask(student, "Какая стипендия за отличную сессию?")[0]


@pytest.mark.parametrize("question, expected", [
    ("что сегодня", (date(2026, 9, 24), date(2026, 9, 24))),
    ("а завтра", (date(2026, 9, 25), date(2026, 9, 25))),
    ("послезавтра", (date(2026, 9, 26), date(2026, 9, 26))),
    ("в среду", (date(2026, 9, 30), date(2026, 9, 30))),
    ("в четверг", (date(2026, 9, 24), date(2026, 9, 24))),
    ("в следующий четверг", (date(2026, 10, 1), date(2026, 10, 1))),
    ("на этой неделе", (date(2026, 9, 24), date(2026, 9, 27))),
    ("на следующей неделе", (date(2026, 9, 28), date(2026, 10, 4))),
    ("где столовая", None),
])
def test_parse_when(question, expected):
    assert assistant.parse_when(question, date(2026, 9, 24)) == expected
