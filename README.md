# 🚀 Официальный Портал & Гид Адаптации Студентов ИВИТШ КГУ

Официальный веб-портал и интерактивный адаптационный гид первокурсников Высшей ИТ-Школы Костромского Государственного Университета (ИВИТШ КГУ).

---

## 🌟 Основные Возможности Проекта

- 🎓 **Путь первокурсника**: Чек-лист важных дел, интерактивные обучающие карточки адаптации.
- 💬 **Студенческий Форум**: Обсуждения, вопросы, голосования за лучшие ответы и модерация.
- 🤖 **ИИ Чат-бот ВИТШик (RAG Engine)**: Настоящий гид на базе GigaChat с распознаванием корпусов, аудиторий, расписаний и преподавателей с каскадным локальным фолбэком.
- 👨‍🏫 **Официальный Справочник Преподавателей**: Полный список кафедр, кабинеты, степени и фотографии 18 реальных преподавателей ИВИТШ.
- 🏛️ **Интерактивная Карта Корпуса Б**: Интерактивные схемы и расположения аудиторий 101–409 и Коворкинга.
- 🔑 **Безопасная Авторизация через СДО КГУ**: Вход через логин и пароль цифровой платформы `sdo.kosgos.ru` и JWT-сессии.

---

## 🏗️ Архитектура Репозитория

```text
CombinedPortal/
├── client/                     # React 18 + Vite SPA (Фронтенд)
├── server/                     # Python 3.11 + FastAPI (REST API Бэкенд)
├── infrastructure/             # DevOps конфигурации и скрипты запуска
│   ├── docker/
│   │   ├── Dockerfile.client   # Docker-образ фронтенда (Node build + Nginx)
│   │   └── Dockerfile.server   # Docker-образ бэкенда (Python FastAPI)
│   ├── docker-compose.yml      # Контейнеризация сервисов
│   ├── nginx.conf              # Nginx прокси с HSTS, CSP и Rate Limiting
│   └── DEPLOYMENT_GUIDE.md     # Инструкция по развертыванию
├── api/                        # Serverless функции Vercel
├── .env.example                # Переменные окружения (без секретов)
└── package.json                # Корневые команды управления
```

---

## 🌐 Настройка Домена (`ivitshGuide.kosgos.ru`)

Для развертывания портала в инфраструктуре КГУ закреплен официальный домен 3-го уровня:
👉 **`ivitshGuide.kosgos.ru`** (альтернативно: `portal.kosgos.ru` / `ivitsh.kosgos.ru`).

Nginx сконфигурирован на обработку домена `ivitshGuide.kosgos.ru`, проксирование API-запросов (`/api/`), документации Swagger (`/docs`) и отдачу React SPA.

---

## 🚀 Быстрый запуск

### Вариант 1: Запуск через Docker (Рекомендуемый для Сервера / ВМ)

1. Подготовьте файл окружения в корне:
   ```bash
   cp .env.example .env
   ```

2. Перейдите в папку `infrastructure` и запустите сборку контейнеров:
   ```bash
   cd infrastructure
   docker compose up -d --build
   ```
   *(Или из корня репозитория: `docker compose -f infrastructure/docker-compose.yml up -d --build`)*

3. Проверьте доступность:
   - 💻 **Веб-портал**: `http://portal.kosgos.ru` (или `http://localhost`)
   - 📖 **Swagger API Документация**: `http://portal.kosgos.ru/docs` (или `http://localhost/docs`)

---

### Вариант 2: Локальная разработка (без Docker)

**1. Бэкенд (FastAPI):**
```bash
python3 -m venv server/venv
source server/venv/bin/activate
pip install -r server/requirements.txt
PYTHONPATH=server python3 -m uvicorn server.main:app --reload --port 8000
```

**2. Фронтенд (React Vite):**
```bash
cd client
npm install
npm run dev
```

---

## 📖 Подробное руководство по развертыванию
Полная инструкция по настройке SSL, проксированию Nginx и передаче проекта на Виртуальную Машину доступна в [infrastructure/DEPLOYMENT_GUIDE.md](infrastructure/DEPLOYMENT_GUIDE.md).
