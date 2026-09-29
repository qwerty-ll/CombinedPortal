"""The rooms of корпус Б: places, computers, laptops, OS, equipment and software (app/assets/rooms.json).

The file is built from the ИВИТШ rooms table by scripts/import_rooms.py; the map and ВИТШик read it from here.
"""
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

DATA_FILE = Path(__file__).resolve().parents[1] / "assets" / "rooms.json"

# Words students use for a program, besides its own name
SOFTWARE_ALIASES = {
    "Python 3": ["питон", "пайтон", "python"],
    "PyCharm": ["пайчарм", "пучарм", "python", "питон", "пайтон"],
    "IDLE": ["python", "питон", "пайтон"],
    "1С:Предприятие": ["1с", "1c"],
    "Visual Studio 2022": ["visual studio", "вижуал студио", "визуал студио", "вижл студио"],
    "Visual Studio 2019": ["visual studio", "вижуал студио", "визуал студио", "вижл студио"],
    "VS Code": ["vscode", "вс код", "vs code", "visual studio code"],
    "IntelliJ IDEA": ["intellij", "интеллидж", "интелидж"],
    "Unity Hub": ["unity", "юнити"],
    "Unity 2019.4": ["unity", "юнити"],
    "Blender": ["блендер"],
    "GIMP": ["гимп"],
    "Krita": ["крита"],
    "Inkscape": ["инкскейп"],
    "PostgreSQL": ["постгрес", "postgres", "постгре"],
    "MySQL и MySQL Workbench": ["mysql", "майскл", "workbench"],
    "MS SQL Server": ["sql server", "mssql", "ms sql"],
    "SSMS": ["management studio"],
    "КОМПАС-3D": ["компас", "kompas"],
    "КуМир": ["кумир"],
    "PascalABC": ["паскал", "pascal"],
    "Lazarus": ["лазарус"],
    "VirtualBox": ["виртуалбокс", "виртуал бокс", "virtual box"],
    "Cisco Packet Tracer": ["cisco", "циско", "packet tracer", "пакет трейсер"],
    "LibreOffice": ["либреофис", "либре офис", "libre office"],
    "Android Studio": ["андроид", "android"],
    "Java": ["джава", "java"],
    "Code::Blocks": ["codeblocks", "code blocks", "кодблокс"],
    "GNU Octave": ["octave", "октав"],
    "DaVinci Resolve": ["davinci", "да винчи", "давинчи"],
    "GameMaker": ["гейммейкер", "game maker"],
    "nanoCAD": ["нанокад", "nanocad"],
    "Loginom": ["логином"],
    "Deductor": ["дедуктор"],
    "Veyon": ["веон"],
}
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
    programs = [p for p in room["software"] if p != "просмотр PDF"]
    if programs:
        lines.append("Программы: " + ", ".join(programs) + ".")
    return "\n".join(lines)


def _mentions(q: str, word: str) -> bool:
    # A Russian word may take an ending: «в питоне», «в блендере»
    ending = "[а-я]*" if re.search("[а-я]$", word) else ""
    return re.search(rf"(?<![a-zа-я0-9]){re.escape(word)}{ending}(?![a-zа-я0-9])", q) is not None


def software_in(q: str) -> List[str]:
    """Programs named in a question, as the table names them: "где есть питон" → Python 3, PyCharm, IDLE."""
    installed = {p for r in rooms() for p in r["software"]}
    found = []
    for name in sorted(installed, key=str.lower):
        words = [name.lower().replace("ё", "е")] + SOFTWARE_ALIASES.get(name, [])
        if name != "просмотр PDF" and any(_mentions(q, w) for w in words):
            found.append(name)
    return found


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
        if name != "коворкинг витш" and (_mentions(q, name) or _mentions(q, name.replace(" ", ""))):
            named.append(space)
    if not named and "переговорн" in q:
        named = [s for s in spaces() if s["type"] == "переговорная"]
    return named


def where(space: dict) -> str:
    if space.get("room") and space["room"].isdigit():
        return f"Б-{space['room']}, {space['floor']} этаж корпуса Б"
    if space.get("floor"):
        return f"{space['floor']} этаж корпуса Б"
    return ""
