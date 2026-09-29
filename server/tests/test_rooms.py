"""The rooms base of корпус Б (from the ИВИТШ rooms table) and its API."""
import pytest

from app.services import eios, rooms, timetable
from test_scenarios import ANSWERS, NOW


def test_the_base_matches_the_table():
    by_number = {r["number"]: r for r in rooms.rooms()}
    assert len(by_number) == 28 and {"101", "209", "108"} & set(by_number) == {"101"}
    assert by_number["101"] | {"software": None} == {
        "number": "101", "floor": 1, "type": "мультимедийный класс", "seats": 50, "teacher_pc": True, "pcs": 23, "laptops": 28,
        "os": "Windows", "equipment": ["переносная доска", "телевизор", "сенсорный стол", "веб-камера", "кликер", "наушники"],
        "software": None,
    }
    assert by_number["104"]["os"] == "Linux" and by_number["407"]["seats"] == 180
    # "нет" and "-" in the table are no equipment and no computers
    assert "веб-камера" not in by_number["102"]["equipment"] and by_number["204"]["pcs"] == by_number["204"]["laptops"] == 0
    assert by_number["403"]["teacher_pc"] is False
    # Two "Unity Hub" columns of the table are one program
    assert by_number["201"]["software"].count("Unity Hub") == 1
    assert {s["name"] for s in rooms.spaces()} == {"ИТ улей", "8 бит", "Переговорная 2 этажа", "16 бит", "64 бит", "Коворкинг ВИТШ"}


def test_words_for_programs_and_systems():
    assert rooms.software_in("где можно поработать в питоне") == ["IDLE", "PyCharm", "Python 3"]
    assert rooms.software_in("где есть 1с") == ["1С:Предприятие"]
    assert rooms.software_in("есть идея где поесть") == []
    assert rooms.os_in("где линукс") == "Linux" and rooms.os_in("на винде") == "Windows"
    assert rooms.summary(rooms.get("204")) == "лекционная: 75 мест, ПК преподавателя на Windows"
    assert rooms.summary(rooms.get("403")) == "лаборатория: 2 места, 2 ПК на Windows"


def test_rooms_api(client):
    data = client.get("/api/v1/rooms").json()
    assert len(data["rooms"]) == 28 and data["rooms"][0]["number"] == "101"
    assert next(s for s in data["spaces"] if s["name"] == "8 бит") == {
        "name": "8 бит", "type": "коворкинг", "seats": 50, "equipment": ["переносная доска", "телевизор"], "floor": 1, "room": "108",
    }


@pytest.fixture
def fake_timetable(monkeypatch):
    async def fetch_json(endpoint, params, timeout=5.0):
        return ANSWERS.get((endpoint, frozenset(params.items())))

    monkeypatch.setattr(eios, "fetch_json", fetch_json)
    monkeypatch.setattr(timetable, "msk_now", lambda: NOW)


def test_today_in_a_room(client, fake_timetable):
    data = client.get("/api/v1/rooms/407/today").json()
    assert data["date"] == "2026-09-24" and data["room"] == "Б-407" and data["in_timetable"] is True
    assert [(l["start"], l["discipline"], l["kind"]) for l in data["lessons"]] == [
        ("10:10", "Базы данных", "лабораторная"), ("11:50", "Базы данных", "лекция"),
    ]
    # A room EIOS does not list has no pairs; not a number of корпус Б is not found
    assert client.get("/api/v1/rooms/301/today").json() == {"date": "2026-09-24", "room": "Б-301", "in_timetable": False, "lessons": []}
    assert client.get("/api/v1/rooms/999/today").status_code == 404
    assert client.get("/api/v1/rooms/..%2F..%2Fetc/today").status_code == 404


def test_today_without_eios(client, monkeypatch):
    async def unavailable(endpoint, params, ttl):
        raise timetable.TimetableUnavailable("EIOS is down")

    monkeypatch.setattr(timetable, "cached", unavailable)
    assert client.get("/api/v1/rooms/407/today").status_code == 503
