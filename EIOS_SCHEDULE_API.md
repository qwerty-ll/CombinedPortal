# EIOS KOSGOS Schedule API Documentation

Документация по работе с API расписания портала **ЭИОС КГУ** (`https://eios.kosgos.ru/`).

API является **публичным** (для получения базового расписания групп, преподавателей и аудиторий авторизация и токены не требуются).

---

## 📌 Базовая информация

* **Base URL:** `https://eios.kosgos.ru/api`
* **Формат данных:** `JSON` (за исключением iCal экспорта)
* **Метод запросов:** `GET`
* **CORS / Заголовки:** Обычный HTTP/HTTPS запрос. Заголовок `Accept: application/json`.

---

## 🚀 Пошаговый алгоритм работы

```
 ┌───────────────────────────┐
 │ 1. Получить список лет    │  ---> GET /api/Rasp/ListYears
 └─────────────┬─────────────┘
               │
 ┌─────────────▼─────────────┐
 │ 2. Найти ID объекта       │  ---> GET /api/raspGrouplist?year=2025-2026
 │ (Группа / Преп / Ауд)    │       GET /api/raspTeacherlist?year=2025-2026
 └─────────────┬─────────────┘       GET /api/raspAudlist?year=2025-2026
               │
 ┌─────────────▼─────────────┐
 │ 3. Запросить расписание   │  ---> GET /api/Rasp?idGroup=8540&year=2025-2026
 └───────────────────────────┘
```

---

## 1️⃣ Справочники и получение ID

Перед запросом расписания необходимо получить цифровой `ID` нужного объекта (группы, преподавателя или аудитории) для выбранного учебного года.

### 1.1 Доступные учебные года
* **Эндпоинт:** `GET /api/Rasp/ListYears`
* **Пример ответа:**
```json
{
  "data": {
    "years": [
      "2024-2025",
      "2025-2026",
      "2026-2027"
    ],
    "showPreviousYears": true
  },
  "state": 1,
  "msg": "Года"
}
```

---

### 1.2 Поиск ID группы
* **Эндпоинт:** `GET /api/raspGrouplist?year={YEAR}`
* **Параметры:** `year` (обязательный) — например, `2025-2026`
* **Пример ответа:**
```json
{
  "data": [
    {
      "id": 8540,
      "name": "24-ИСбо-1",
      "kurs": 2,
      "facul": "ИВИТШ",
      "facultyID": 36,
      "yearName": "2025-2026"
    },
    {
      "id": 8153,
      "name": "21-ДИбо-5",
      "kurs": 5,
      "facul": "ИКИ",
      "facultyID": 25,
      "yearName": "2025-2026"
    }
  ]
}
```
* **Поля в `data[]`:**
  * `id` (`number`) — Уникальный ID группы в системе (используется для получения расписания).
  * `name` (`string`) — Название группы (например, `"24-ИСбо-1"`).
  * `kurs` (`number`) — Курс обучения.
  * `facul` (`string`) — Аббревиатура института/факультета.
  * `facultyID` (`number`) — ID факультета.

---

### 1.3 Поиск ID преподавателя
* **Эндпоинт:** `GET /api/raspTeacherlist?year={YEAR}`
* **Параметры:** `year` (обязательный) — например, `2025-2026`
* **Пример ответа:**
```json
{
  "data": [
    {
      "id": 1104,
      "name": "Ярыгина Александра Александровна",
      "kaf": "Декоративно-прикладное искусство",
      "idFromRasp": false
    }
  ]
}
```
* **Поля в `data[]`:**
  * `id` (`number`) — Уникальный ID преподавателя.
  * `name` (`string`) — ФИО преподавателя.
  * `kaf` (`string | null`) — Название кафедры.

---

### 1.4 Поиск ID аудитории
* **Эндпоинт:** `GET /api/raspAudlist?year={YEAR}`
* **Параметры:** `year` (обязательный) — например, `2025-2026`
* **Пример ответа:**
```json
{
  "data": [
    {
      "id": 3567358,
      "name": "Б1-29"
    },
    {
      "id": 3569734,
      "name": "Б-101"
    }
  ]
}
```
* **Поля в `data[]`:**
  * `id` (`number`) — Уникальный ID аудитории.
  * `name` (`string`) — Название / номер аудитории.

---

### 1.5 Типы недель (Числитель / Знаменатель)
* **Эндпоинт:** `GET /api/Rasp/TypesWeek`
* **Пример ответа:**
```json
{
  "data": {
    "types": [
      { "typeWeekID": 0, "name": "Каждая", "shortName": null },
      { "typeWeekID": 1, "name": "Над чертой (числитель)", "shortName": "" },
      { "typeWeekID": 2, "name": "Под чертой (знаменатель)", "shortName": "" }
    ]
  }
}
```

---

## 2️⃣ Запрос расписания

Расписание запрашивается через общий эндпоинт `/api/Rasp`.

### Эндпоинты

| Тип объекта | Эндпоинт запроса | Пример |
| :--- | :--- | :--- |
| **Группа** | `GET /api/Rasp?idGroup={groupID}&year={YEAR}` | `/api/Rasp?idGroup=8540&year=2025-2026` |
| **Преподаватель** | `GET /api/Rasp?idTeacher={teacherID}&year={YEAR}` | `/api/Rasp?idTeacher=1104&year=2025-2026` |
| **Аудитория** | `GET /api/Rasp?idAud={audID}&year={YEAR}` | `/api/Rasp?idAud=3567358&year=2025-2026` |

### Дополнительные параметры Query:

* `sdate=YYYY-MM-DD` (необязательный) — фильтрация расписания по конкретной дате (например: `&sdate=2026-05-20`).
* `iCal=true` (необязательный) — возвращает файл `.ics` календаря (iCalendar) вместо JSON.

---

## 3️⃣ Структура ответа расписания

Пример запроса: `GET https://eios.kosgos.ru/api/Rasp?idGroup=8540&year=2025-2026`

```json
{
  "data": {
    "isCyclicalSchedule": false,
    "info": {
      "group": {
        "name": "24-ИСбо-1",
        "groupID": 8540,
        "year": "2025-2026"
      },
      "prepod": { "name": "", "userID": null },
      "kafedra": { "name": "" },
      "aud": { "name": "" },
      "year": "2025-2026",
      "curWeekNumber": 1,
      "curNumNed": 1,
      "curSem": 2,
      "dateUploadingRasp": "2026-05-27T14:05:12"
    },
    "rasp": [
      {
        "код": 5339108,
        "дата": "2026-05-20T00:00:00",
        "датаНачала": "2026-05-20T19:00:00",
        "датаОкончания": "2026-05-20T20:30:00",
        "начало": "19:00",
        "конец": "20:30",
        "деньНедели": 3,
        "день_недели": "Среда",
        "код_Семестра": 2,
        "типНедели": 38,
        "номерПодгруппы": 0,
        "часов": null,
        "дисциплина": "пр Python для искусственного интеллекта в (ТЭК, АПК, образовании), п/г 1",
        "преподаватель": "Селезнев М.В.",
        "кодПреподавателя": 1130,
        "фиоПреподавателя": "Цынь Л. ..",
        "аудитория": "СДО-1",
        "учебныйГод": "2025-2026",
        "группа": "24-ИСбо-1",
        "номерЗанятия": 7,
        "цвет": "#e49400",
        "замена": false
      }
    ]
  },
  "state": 1,
  "msg": "Расписание"
}
```

### Справочник полей объекта занятия (`rasp[]`):

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `код` | `number` | Уникальный ID записи пара |
| `дата` | `string` | Дата занятия в формате ISO (`YYYY-MM-DDT00:00:00`) |
| `датаНачала` | `string` | Дата и точное время начала пары (`YYYY-MM-DDT19:00:00`) |
| `датаОкончания` | `string` | Дата и точное время окончания пары |
| `начало` | `string` | Время начала пары (`HH:mm`) |
| `конец` | `string` | Время окончания пары (`HH:mm`) |
| `деньНедели` | `number` | Порядковый номер дня недели (`1` - Пн, `2` - Вт, ..., `7` - Вс) |
| `день_недели` | `string` | Название дня недели (`"Среда"`, `"Понедельник"`) |
| `номерЗанятия` | `number` | Порядковый номер пары (1, 2, 3, 4, 5, 6, 7...) |
| `дисциплина` | `string` | Полное наименование предмета и тип (лек/лаб/пр) |
| `преподаватель` | `string` | Фамилия и инициалы преподавателя |
| `кодПреподавателя`| `number` | ID преподавателя |
| `аудитория` | `string` | Номер/название кабинета или аудитории |
| `группа` | `string` | Название учебной группы |
| `номерПодгруппы` | `number` | Номер подгруппы (0 — вся группа) |
| `код_Семестра` | `number` | 1 — осенний семестр, 2 — весенний семестр |
| `замена` | `boolean` | Признак замены пары |
| `цвет` | `string` | HEX-код цвета для отображения в интерфейсе |

---

## 4️⃣ Готовый клиент на JavaScript / TypeScript

Можете скопировать этот класс напрямую в ваш TypeScript/JavaScript проект.

```typescript
export interface GroupItem {
  id: number;
  name: string;
  kurs: number;
  facul: string;
  facultyID: number;
  yearName: string;
}

export interface LessonItem {
  код: number;
  дата: string;
  датаНачала: string;
  датаОкончания: string;
  начало: string;
  конец: string;
  деньНедели: number;
  день_недели: string;
  номерЗанятия: number;
  дисциплина: string;
  преподаватель: string;
  аудитория: string;
  группа: string;
  номерПодгруппы: number;
  цвет?: string;
}

export class KosgosScheduleClient {
  private baseUrl = 'https://eios.kosgos.ru/api';

  /** Получить список учебных лет */
  async getYears(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/Rasp/ListYears`);
    const data = await res.json();
    return data?.data?.years || [];
  }

  /** Найти ID группы по имени */
  async findGroupId(groupName: string, year: string): Promise<number | null> {
    const res = await fetch(`${this.baseUrl}/raspGrouplist?year=${encodeURIComponent(year)}`);
    const data = await res.json();
    const groups: GroupItem[] = data?.data || [];
    const group = groups.find(
      (g) => g.name.trim().toLowerCase() === groupName.trim().toLowerCase()
    );
    return group ? group.id : null;
  }

  /** Получить расписание группы за весь учебный год или на конкретную дату */
  async getGroupSchedule(groupId: number, year: string, sdate?: string): Promise<LessonItem[]> {
    let url = `${this.baseUrl}/Rasp?idGroup=${groupId}&year=${encodeURIComponent(year)}`;
    if (sdate) {
      url += `&sdate=${encodeURIComponent(sdate)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return data?.data?.rasp || [];
  }

  /** Удобный метод: расписание группы по названию и дате (YYYY-MM-DD) */
  async getScheduleForGroupDate(groupName: string, year: string, dateStr: string): Promise<LessonItem[]> {
    const groupId = await this.findGroupId(groupName, year);
    if (!groupId) {
      throw new Error(`Группа "${groupName}" не найдена в году ${year}`);
    }
    const lessons = await this.getGroupSchedule(groupId, year);
    return lessons.filter((l) => l.дата && l.дата.startsWith(dateStr));
  }
}
```

### Пример использования:

```javascript
const client = new KosgosScheduleClient();

async function run() {
  // Получаем расписание группы 24-ИСбо-1 на 20 мая 2026 года
  const lessons = await client.getScheduleForGroupDate('24-ИСбо-1', '2025-2026', '2026-05-20');
  
  console.log(`Найдено пар: ${lessons.length}`);
  lessons.forEach((l) => {
    console.log(`[${l.начало} - ${l.конец}] ${l.дисциплина} (${l.преподаватель}) - Каб. ${l.аудитория}`);
  });
}

run();
```

---

## 5️⃣ Пример клиента на Python

```python
import requests
from typing import List, Dict, Optional

class KosgosScheduleAPI:
    BASE_URL = "https://eios.kosgos.ru/api"

    @classmethod
    def get_years(cls) -> List[str]:
        res = requests.get(f"{cls.BASE_URL}/Rasp/ListYears").json()
        return res.get("data", {}).get("years", [])

    @classmethod
    def get_group_id(cls, group_name: str, year: str) -> Optional[int]:
        res = requests.get(f"{cls.BASE_URL}/raspGrouplist", params={"year": year}).json()
        groups = res.get("data", [])
        for g in groups:
            if g.get("name", "").strip().lower() == group_name.strip().lower():
                return g.get("id")
        return None

    @classmethod
    def get_group_schedule(cls, group_id: int, year: str, date_str: Optional[str] = None) -> List[Dict]:
        params = {"idGroup": group_id, "year": year}
        if date_str:
            params["sdate"] = date_str
        res = requests.get(f"{cls.BASE_URL}/Rasp", params=params).json()
        return res.get("data", {}).get("rasp", [])

# Пример вызова:
if __name__ == "__main__":
    api = KosgosScheduleAPI()
    group_id = api.get_group_id("24-ИСбо-1", "2025-2026")
    if group_id:
        lessons = api.get_group_schedule(group_id, "2025-2026", "2026-05-20")
        for lesson in lessons:
            print(f"[{lesson['начало']}-{lesson['конец']}] {lesson['дисциплина']} - {lesson['преподаватель']} ({lesson['аудитория']})")
```
