# 🚀 Официальный Портал & Гид Адаптации Студентов ИВИТШ КГУ

Официальный веб-портал и интерактивный адаптационный гид первокурсников Высшей ИТ-Школы Костромского Государственного Университета (ИВИТШ КГУ).

---

## 🌟 Основные Возможности Проекта

- 🎓 **Путь первокурсника**: Чек-лист важных дел, интерактивные обучающие карточки адаптации.
- 💬 **Студенческий Форум**: Обсуждения, вопросы, голосования за лучшие ответы и модерация.
- 🤖 **ИИ Чат-бот ВИТШик (RAG)**: отвечает по базе знаний ИВИТШ (аудитории 101–409, стипендии, клубы, преподаватели). Для вошедших пользователей ответ перефразирует GigaChat; гости получают ответ прямо из базы знаний.
- 👨‍🏫 **Официальный Справочник Преподавателей**: Список кафедр, кабинеты, степени и официальные фотографии **17 реальных преподавателей ИВИТШ КГУ**.
- 🗓️ **Расписание (интеграция с ЭИОС КГУ)**: данные ЭИОС кэшируются на сервере; если ЭИОС недоступна, показывается последняя сохранённая копия с пометкой либо честное сообщение об ошибке — без выдуманных занятий.
- 🏛️ **Интерактивная Карта Корпуса Б**: Интерактивные схемы и расположения аудиторий 101–409 и Коворкинга ВИТШ (4 этаж).
- 🔑 **Безопасность**: вход через ЭИОС с привязкой к ID пользователя ЭИОС, JWT только в httpOnly-куке, CSRF-защита, ограничение попыток входа, блокировка пользователей, HTTPS с HSTS и строгой CSP.

---

## 🏗️ Архитектура Репозитория

```text
CombinedPortal/
├── client/                     # React 18 + Vite SPA
├── server/                     # Python 3.11 + FastAPI
│   ├── app/                    # routers, models, schemas, services, core (config, security, rate limit)
│   ├── migrations/             # миграции Alembic
│   └── tests/                  # pytest
├── infrastructure/
│   ├── docker/                 # Dockerfile.client (Node build + Nginx), Dockerfile.server
│   ├── nginx/                  # конфигурация Nginx (HTTPS, CSP, rate limiting)
│   ├── certs/                  # TLS-сертификат (не коммитится)
│   ├── docker-compose.yml
│   └── DEPLOYMENT_GUIDE.md
├── docs/                       # описание API ЭИОС и СДО КГУ
├── .env.example                # все переменные окружения (без секретов)
└── package.json                # корневые команды
```

---

## 🌐 Настройка Домена (`ivitsh-portal.kosgos.ru`)

Для развертывания портала в инфраструктуре КГУ закреплен официальный домен 3-го уровня:
👉 **`ivitsh-portal.kosgos.ru`** (альтернативно: `portal.kosgos.ru` / `itschool.kosgos.ru`).

Nginx сконфигурирован на обработку домена `ivitsh-portal.kosgos.ru`, проксирование API-запросов (`/api/`), переключение документации Swagger (`DOCS_ENABLED`) и отдачу React SPA.

---

## 🚀 Быстрый запуск

### Продакшен (Docker)

```bash
cp .env.example .env        # заполните SECRET_KEY, POSTGRES_PASSWORD, ADMIN_*, GIGACHAT_*
# положите TLS-сертификат в infrastructure/certs/ (см. DEPLOYMENT_GUIDE.md)
docker compose -f infrastructure/docker-compose.yml up -d --build
```

Портал: `https://ivitsh-portal.kosgos.ru` (или `https://localhost`).

### Локальная разработка

```bash
cp .env.example .env        # задайте SECRET_KEY и ADMIN_*; для http://localhost можно COOKIE_SECURE=false

# Backend
python3 -m venv server/venv && source server/venv/bin/activate
pip install -r server/requirements-dev.txt
npm run server              # http://localhost:8000, миграции применяются при старте

# Frontend (в другом терминале)
npm --prefix client install
npm run dev                 # http://localhost:5173, /api проксируется на :8000

# Тесты backend
npm test
```

### Демо-режим (без доступа к ЭИОС)

Поддельный ЭИОС пускает студентом с любым логином и паролем `demo` и отдаёт расписание на неделю;
второй скрипт заполняет портал объявлениями, FAQ и вопросами на форуме.

```bash
# в .env: COOKIE_SECURE=false и EIOS_BASE_URL=http://127.0.0.1:9000/api
python3 scripts/demo/demo_eios.py                                  # отдельный терминал
npm run server                                                     # backend
python3 scripts/demo/seed_demo.py portal_admin <ADMIN_PASSWORD>    # один раз
npm run dev                                                        # http://localhost:5173
```

Вход студентом: «Личный кабинет» → «Студент ЭИОС КГУ», логин `25-isbo-011`, пароль `demo`.
Вход администратором: «Сотрудник ИВИТШ», `ADMIN_USERNAME` / `ADMIN_PASSWORD` из `.env`.

---

## 🎨 Дизайн

Интерфейс следует правилам [impeccable](https://github.com/pbakaus/impeccable) (основа) и
[taste-skill](https://github.com/Leonxlnx/taste-skill) (числовые ограничения). Решения описаны в
[docs/DESIGN.md](docs/DESIGN.md), сравнение «до/после» — в [docs/redesign/](docs/redesign/).

- Токены (цвет, типографика, отступы, радиусы, движение) — `client/src/styles/tokens.css`; новые hex-значения в коде не используются.
- Общие компоненты — `client/src/styles/shared.css`; стили разделов — `client/src/styles/<раздел>.css`.
- Шрифт Golos Text подключён локально (`@fontsource-variable/golos-text`), Google Fonts не нужен.
- Проверка анти-паттернов: `npx -y impeccable detect http://localhost:5173/` (нужен Chrome).

---

## 📖 Развертывание
Настройка HTTPS, сертификата GigaChat, базы данных и смена скомпрометированных секретов описаны в
[infrastructure/DEPLOYMENT_GUIDE.md](infrastructure/DEPLOYMENT_GUIDE.md).
