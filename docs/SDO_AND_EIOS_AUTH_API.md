# SDO KOSGOS (Moodle) & EIOS Auth & API Documentation

Документация по авторизации и работе с API **СДО КГУ** (`https://sdo.kosgos.ru/`) и интеграции с **ЭИОС КГУ** (`https://eios.kosgos.ru/`).

---

## 📌 Архитектура и связь систем

```
 ┌──────────────────────────────────┐        ┌──────────────────────────────────┐
 │          SDO KOSGOS              │        │           EIOS KOSGOS            │
 │     https://sdo.kosgos.ru/       │        │      https://eios.kosgos.ru/     │
 │       (Moodle LMS Engine)        │        │      (Vue.js + REST API)         │
 └─────────────────┬────────────────┘        └─────────────────┬────────────────┘
                   │                                           │
                   └─────────── Единый аккаунт (SSO) ──────────┘
                              (Логин / Пароль едины)
```

1. **СДО КГУ (`sdo.kosgos.ru`)** работает на базе **Moodle LMS** (тема *Moove*).
2. **ЭИОС КГУ (`eios.kosgos.ru`)** использует ту же базу пользователей (учетные данные логин/пароль совпадают).

---

## 1️⃣ Авторизация и получение API Токена СДО

СДО поддерживает официальный протокол **Moodle Mobile Web Services**.

### Запрос токена Moodle (`wstoken`)

* **URL:** `POST` / `GET` `https://sdo.kosgos.ru/login/token.php`
* **Параметры Query / Form Data:**
  * `username` (`string`) — логин пользователя (студента/преподавателя)
  * `password` (`string`) — пароль
  * `service` (`string`) — `moodle_mobile_app`

#### Пример ответа при успешной авторизации:
```json
{
  "token": "7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d",
  "privatetoken": "xyz123..."
}
```

#### Пример ответа при ошибке:
```json
{
  "error": "Неверный логин или пароль, попробуйте заново.",
  "errorcode": "invalidlogin"
}
```

---

## 2️⃣ Работа с Moodle REST API в СДО

После получения `wstoken` все запросы отправляются на единый эндпоинт Moodle REST API:

* **URL:** `POST https://sdo.kosgos.ru/webservice/rest/server.php`
* **Обязательные параметры:**
  * `wstoken` — ваш полученный токен.
  * `moodlewsrestformat` — `json`
  * `wsfunction` — название вызываемой функции Moodle.

---

### Основные функции Moodle API

| Функция (`wsfunction`) | Описание | Основные параметры |
| :--- | :--- | :--- |
| `core_webservice_get_site_info` | Информация о пользователе (ID, ФИО, аватарка, роли) | (нет) |
| `core_enrol_get_users_courses` | Список всех курсов (предметов) пользователя | `userid` (из `site_info`) |
| `core_course_get_contents` | Модули, темы, материалы и файлы внутри курса | `courseid` |
| `mod_assign_get_assignments` | Домашние задания, дедлайны и статусы сдачи | `courseids[0]` |
| `gradereport_user_get_grade_items` | Оценки студента по предмету | `courseid` |
| `core_calendar_get_action_events_by_timesort` | Календарь событий, дедлайны | `timesortfrom` |

---

### Пример 1: Получение профиля пользователя (`core_webservice_get_site_info`)

```http
POST https://sdo.kosgos.ru/webservice/rest/server.php?wstoken=ВАШ_ТОКЕН&moodlewsrestformat=json&wsfunction=core_webservice_get_site_info
```

#### Ответ:
```json
{
  "sitename": "СДО КГУ",
  "username": "student_login",
  "firstname": "Иван",
  "lastname": "Иванов",
  "fullname": "Иванов Иван Иванович",
  "userid": 12345,
  "userpictureurl": "https://sdo.kosgos.ru/pluginfile.php/...",
  "usermaxuploadfilesize": 104857600
}
```

---

### Пример 2: Получение списка курсов (`core_enrol_get_users_courses`)

```http
POST https://sdo.kosgos.ru/webservice/rest/server.php?wstoken=ВАШ_ТОКЕН&moodlewsrestformat=json&wsfunction=core_enrol_get_users_courses&userid=12345
```

#### Ответ:
```json
[
  {
    "id": 4321,
    "fullname": "Базы данных (2025-2026)",
    "shortname": "БД-2025",
    "idnumber": "",
    "summary": "Курс по дисциплине Базы данных...",
    "startdate": 1725138000,
    "enddate": 1751317200,
    "progress": 45
  }
]
```

---

## 3️⃣ Авторизация в ЭИОС (`eios.kosgos.ru`)

В отличие от СДО, Личный кабинет ЭИОС имеет собственный REST API авторизации.

### Авторизация пользователя в ЭИОС
* **URL:** `POST https://eios.kosgos.ru/api/tokenauth`
* **Заголовки:** `Content-Type: application/json`
* **Тело:**
```json
{
  "userName": "ваш_логин",
  "password": "ваш_пароль"
}
```

#### Ответ при успехе:
```json
{
  "state": 1,
  "msg": "Успешно",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "data": {
    "user": {
      "userID": 12345,
      "shortFIO": "Иванов И. И.",
      "login": "student_login"
    }
  }
}
```

Для последующих запросов к `eios.kosgos.ru/api/` заголовок авторизации:
`Authorization: Bearer {accessToken}` или передача через cookie `authToken`.

---

## 4️⃣ Готовый Python Клиент для СДО (Moodle)

```python
import requests

class MoodleSDOClient:
    def __init__(self, base_url="https://sdo.kosgos.ru"):
        self.base_url = base_url
        self.token = None
        self.user_info = None

    def login(self, username, password):
        url = f"{self.base_url}/login/token.php"
        params = {
            "username": username,
            "password": password,
            "service": "moodle_mobile_app"
        }
        res = requests.get(url, params=params).json()
        if "token" in res:
            self.token = res["token"]
            self.user_info = self.call("core_webservice_get_site_info")
            return True
        else:
            raise Exception(res.get("error", "Ошибка входа в СДО"))

    def call(self, function_name, **kwargs):
        if not self.token:
            raise Exception("Сначала выполните login()")
        url = f"{self.base_url}/webservice/rest/server.php"
        params = {
            "wstoken": self.token,
            "moodlewsrestformat": "json",
            "wsfunction": function_name,
            **kwargs
        }
        return requests.post(url, data=params).json()

    def get_courses(self):
        user_id = self.user_info["userid"]
        return self.call("core_enrol_get_users_courses", userid=user_id)

    def get_course_contents(self, course_id):
        return self.call("core_course_get_contents", courseid=course_id)


# Пример вызова:
if __name__ == "__main__":
    client = MoodleSDOClient()
    # client.login("логин", "пароль")
    # courses = client.get_courses()
    # print(courses)
```
