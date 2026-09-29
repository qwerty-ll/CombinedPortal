"""Builds app/assets/rooms.json from the rooms table of ИВИТШ (xlsx, sheet «Фонд»).

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
SOFTWARE_NAMES = {
    "Android studio": "Android Studio",
    "Cisco packet tracer": "Cisco Packet Tracer",
    "CodeBlocks": "Code::Blocks",
    "Da Vinci": "DaVinci Resolve",
    "Gambas3 (Basic)": "Gambas 3",
    "Gimp": "GIMP",
    "IDLE 3": "IDLE",
    "InkScape": "Inkscape",
    "Intelij IDEA": "IntelliJ IDEA",
    "LTspice XVII": "LTspice",
    "MS SQL Serv": "MS SQL Server",
    "MySQL Community Server, MySQL Workbench": "MySQL и MySQL Workbench",
    "Oracle Virtual Box": "VirtualBox",
    "Pascal ABC": "PascalABC",
    "PDF": "просмотр PDF",
    "Putty portable": "PuTTY",
    "Tina-TI": "TINA-TI",
    "Unity 2019.4.12f1": "Unity 2019.4",
    "Unity hub": "Unity Hub",
    "VivePort": "Viveport",
    "VS 2019": "Visual Studio 2019",
    "VS 2022": "Visual Studio 2022",
    "WPF form Visual": "WPF и Windows Forms",
    "1С Предприятие": "1С:Предприятие",
    "Кумир": "КуМир",
    "Компас": "КОМПАС-3D",
    "Deguctor": "Deductor",
    "nanoCad": "nanoCAD",
    "SmathStudio": "SMath Studio",
    "Phoenix code": "Phoenix Code",
}
OS = {"W": "Windows", "L": "Linux"}
# Coworkings and meeting rooms with a known place on the floor plans
SPACE_PLACES = {"8 бит": {"floor": 1, "room": "108"}, "коверкинг": {"floor": 4, "room": "коворкинг"}, "2 эт.": {"floor": 2}}
SPACE_NAMES = {"8 бит": "8 бит", "коверкинг": "Коворкинг ВИТШ", "2 эт.": "Переговорная 2 этажа"}


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
    software_columns = range(at["ос w/l"] + 1, len(names))

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
            software = []
            for i in software_columns:
                if str(row[i] or "").strip().lower() == "да":
                    name = SOFTWARE_NAMES.get(names[i], names[i])
                    if name not in software:
                        software.append(name)
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
                "software": sorted(software, key=str.lower),
            })
        else:
            key = str(row[0]).strip().lower().replace("ё", "е")
            spaces.append({
                "name": SPACE_NAMES.get(key, str(row[0]).strip()),
                "type": str(cell("тип аудитории")).strip(),
                # For these rows the table gives the number of places in the first column after the type
                "seats": count(cell("пк преподавателя")),
                "equipment": equipment,
                **SPACE_PLACES.get(key, {}),
            })

    OUT.write_text(json.dumps({"rooms": rooms, "spaces": spaces}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{OUT}: {len(rooms)} аудиторий, {len(spaces)} коворкингов и переговорных")


if __name__ == "__main__":
    main(sys.argv[1])
