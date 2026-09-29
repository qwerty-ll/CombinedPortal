"""The rooms of корпус Б: places, computers, laptops, OS and equipment (app/assets/rooms.json).

The file is built from the ИВИТШ rooms table by scripts/import_rooms.py; the map and ВИТШик read it from here.
"""
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

DATA_FILE = Path(__file__).resolve().parents[1] / "assets" / "rooms.json"

OS_WORDS = {
    "Linux": r"линукс|linux|убунт|ubuntu",
    "Windows": r"виндо|windows|винд[аеуы]\b",
}
EQUIPMENT_WORDS = {
    "проектор": r"проектор",
    "телевизор": r"телевизор|\bтв\b|\bтелик",
    "сенсорный стол": r"сенсорн",
    "веб-камера": r"веб.?камер|вебк",
    "видеокамеры": r"видеокамер",
    "микрофоны": r"микрофон",
    "колонки": r"колонк",
    "кликер": r"кликер",
    "наушники": r"наушник",
    "маркерная доска": r"маркерн",
    "меловая доска": r"мелов|мел\b",
    "переносная доска": r"переносн",
}
TYPE_WORDS = {
    "компьютерный класс": r"компьютерн[а-я]* класс",
    "лекционная": r"лекционн|поточн",
    "лаборатория": r"лаборатори[яиюей]",
    "учебная": r"учебн[а-я]* аудитори",
    "мультимедийный класс": r"мультимедийн",
}
TYPE_PLURAL = {
    "компьютерный класс": "Компьютерные классы",
    "лекционная": "Лекционные аудитории",
    "лаборатория": "Лаборатории",
    "учебная": "Учебные аудитории",
    "мультимедийный класс": "Мультимедийные классы",
}


@lru_cache(maxsize=1)
def data() -> Dict[str, list]:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def rooms() -> List[dict]:
    return data()["rooms"]


def spaces() -> List[dict]:
    return data()["spaces"]


def get(number: str) -> Optional[dict]:
    return next((r for r in rooms() if r["number"] == number), None)


def _plural(n: int, one: str, few: str, many: str) -> str:
    if n % 10 == 1 and n % 100 != 11:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


def places(n: int) -> str:
    return f"{n} {_plural(n, 'место', 'места', 'мест')}"


def computers(room: dict) -> str:
    """"13 ПК и 12 ноутбуков", "2 ПК", "" for a room without computers for students."""
    parts = []
    if room["pcs"]:
        parts.append(f"{room['pcs']} ПК")
    if room["laptops"]:
        parts.append(f"{room['laptops']} {_plural(room['laptops'], 'ноутбук', 'ноутбука', 'ноутбуков')}")
    return " и ".join(parts)


def summary(room: dict) -> str:
    """"компьютерный класс: 25 мест, 13 ПК и 12 ноутбуков на Linux"."""
    seats = places(room["seats"])
    has = computers(room)
    if has:
        return f"{room['type']}: {seats}, {has} на {room['os']}"
    teacher = f", ПК преподавателя на {room['os']}" if room["teacher_pc"] and room["os"] else ""
    return f"{room['type']}: {seats}{teacher}"


def details(room: dict) -> str:
    lines = [f"Б-{room['number']} — {summary(room)}, {room['floor']} этаж."]
    if room["equipment"]:
        lines.append("Есть: " + ", ".join(room["equipment"]) + ".")
    return "\n".join(lines)


def _mentions(q: str, word: str) -> bool:
    # A Russian word may take an ending: «в питоне», «в блендере»
    ending = "[а-я]*" if re.search("[а-я]$", word) else ""
    return re.search(rf"(?<![a-zа-я0-9]){re.escape(word)}{ending}(?![a-zа-я0-9])", q) is not None


def os_in(q: str) -> Optional[str]:
    return next((os for os, words in OS_WORDS.items() if re.search(words, q)), None)


def equipment_in(q: str) -> Optional[str]:
    return next((name for name, words in EQUIPMENT_WORDS.items() if re.search(words, q)), None)


def type_in(q: str) -> Optional[str]:
    return next((name for name, words in TYPE_WORDS.items() if re.search(words, q)), None)


def spaces_in(q: str) -> List[dict]:
    """Coworkings and meeting rooms named in a question: «8 бит», «ит улей», «64 бит», «переговорная»."""
    named = []
    for space in spaces():
        name = space["name"].lower().replace("ё", "е")
        if _mentions(q, name) or _mentions(q, name.replace(" ", "")):
            named.append(space)
    if not named and "переговорн" in q:
        named = [s for s in spaces() if s["type"] == "переговорная"]
    return named


# Places on the plans without a number
PLACE_WORDS = {"ит-улей": "в центре 1 этажа корпуса Б, между лестницами", "коворкинг": "на 4 этаже корпуса Б"}


def where(space: dict) -> str:
    if space.get("room") in PLACE_WORDS:
        return PLACE_WORDS[space["room"]]
    if space.get("room") and space["room"].isdigit():
        return f"Б-{space['room']}, {space['floor']} этаж корпуса Б"
    if space.get("floor"):
        return f"{space['floor']} этаж корпуса Б"
    return ""
