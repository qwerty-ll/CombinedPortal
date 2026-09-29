"""Builds app/assets/rooms.json from the rooms table of ИВИТШ (xlsx, sheet «Фонд»); programs are left out.

    pip install openpyxl
    python scripts/import_rooms.py path/to/table.xlsx

Row 2 holds the column names, then one row per room of корпус Б, then coworkings and meeting rooms.
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "app" / "assets" / "rooms.json"

# Column name in the table → what the portal shows
EQUIPMENT = {
    "доска переносная": "переносная доска",
    "доска грифельная": "грифельная доска",
    "тв": "телевизор",
    "проектор": "проектор",
    "колонки": "колонки",
    "микрофоны": "микрофоны",
    "видеокамеры": "видеокамеры",
    "сенсорный стол": "сенсорный стол",
    "веб камера": "веб-камера",
    "кликер": "кликер",
    "наушники": "наушники",
}
BOARDS = {"марк": "маркерная доска", "мел": "меловая доска"}
OS = {"W": "Windows", "L": "Linux"}
# Coworkings and meeting rooms with a known place on the floor plans. The table lists the coworking of the
# 4th floor twice, as «64 бит» and as «ковЁркинг»: the rows are one place.
SPACE_PLACES = {
    "8 бит": {"floor": 1, "room": "108"},
    "ит улей": {"floor": 1, "room": "ит-улей"},
    "64 бит": {"floor": 4, "room": "коворкинг"},
    "2 эт.": {"floor": 2},
}
SPACE_NAMES = {"8 бит": "8 бит", "ит улей": "ИТ улей", "64 бит": "64 бит", "2 эт.": "Переговорная 2 этажа"}
SAME_SPACE = {"коверкинг": "64 бит"}


def header(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def count(value) -> int:
    return int(value) if isinstance(value, (int, float)) else 0


def main(path: str) -> None:
    import openpyxl

    sheet = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(sheet.iter_rows(values_only=True))
    names = [header(v) for v in rows[1]]
    at = {name.lower(): i for i, name in enumerate(names) if name}

    rooms, spaces = [], []
    for row in rows[2:]:
        if row[0] is None:
            continue
        cell = lambda name: row[at[name]]
        present = lambda name: str(cell(name) or "").strip().lower() == "да"
        equipment = ([BOARDS[cell("доска")]] if cell("доска") in BOARDS else []) + [
            shown for name, shown in EQUIPMENT.items() if present(name)
        ]
        if isinstance(row[0], (int, float)):
            number = str(int(row[0]))
            rooms.append({
                "number": number,
                "floor": int(number[0]),
                "type": str(cell("тип аудитории")).strip(),
                "seats": count(cell("количество учебных мест")),
                "teacher_pc": present("пк преподавателя"),
                "pcs": count(cell("пк учебные")),
                "laptops": count(cell("ноутбук кол-во")),
                "os": OS.get(str(cell("ос w/l") or "").strip().upper(), ""),
                "equipment": equipment,
            })
        else:
            key = str(row[0]).strip().lower().replace("ё", "е")
            same = next((s for s in spaces if s["key"] == SAME_SPACE.get(key)), None)
            if same:
                same["equipment"] += [e for e in equipment if e not in same["equipment"]]
                continue
            spaces.append({
                "key": key,
                "name": SPACE_NAMES.get(key, str(row[0]).strip()),
                "type": str(cell("тип аудитории")).strip(),
                # For these rows the table gives the number of places in the first column after the type
                "seats": count(cell("пк преподавателя")),
                "equipment": equipment,
                **SPACE_PLACES.get(key, {}),
            })
    for space in spaces:
        del space["key"]

    OUT.write_text(json.dumps({"rooms": rooms, "spaces": spaces}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{OUT}: {len(rooms)} аудиторий, {len(spaces)} коворкингов и переговорных")


if __name__ == "__main__":
    main(sys.argv[1])
