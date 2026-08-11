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

## 🛠️ Технологический Стек

- **Frontend**: React 18, Vite, Framer Motion, Lucide Icons, React Router 6 (Lazy Code Splitting).
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Passlib (Bcrypt), SQLAlchemy, `httpx` async client.
- **Database**: High-performance Standalone SQLite WAL (Write-Ahead Logging mode).
- **AI & RAG**: GigaChat API + Local Synonym Fallback Engine.
- **DevOps & Infrastructure**: Docker Multi-stage, Docker Compose, Nginx Alpine, Vercel Serverless.

---

## 🚀 Быстрый запуск

### Вариант 1: Запуск через Docker (Рекомендуемый для Сервера / ВМ)
```bash
cp .env.example .env
docker compose up -d --build
```
Сайт откроется по адресу `http://localhost`, а документация API — на `http://localhost:8000/docs`.

### Вариант 2: Локальная разработка

**Бэкенд (FastAPI):**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

**Фронтенд (React Vite):**
```bash
npm install
npm run dev
```

---

## 📖 Документация по развертыванию
Подробное руководство по передаче проекта на Виртуальную Машину доступно в файле [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
