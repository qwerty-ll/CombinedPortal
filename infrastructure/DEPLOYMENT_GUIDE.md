# 📘 РУКОВОДСТВО ПО ПЕРЕДАЧЕ И РАЗВЕРТЫВАНИЮ (DEPLOYMENT HANDOFF GUIDE)

**Проект:** Официальный Портал и Гайд первокурсника Высшей ИТ-Школы КГУ  
**Архитектура:** React (Vite SPA) + FastAPI (REST API) + Standalone SQLite WAL + Nginx Reverse Proxy  
**Домен проекта (3-й уровень):** `ivitsh-portal.kosgos.ru` (альтернативно: `portal.kosgos.ru` / `itschool.kosgos.ru`)  
**Способ развертывания:** Docker Compose (2 отдельных контейнера: `client` и `backend`)

---

## 📋 1. Системные требования на сервере (Виртуальной Машине)

На сервере (Linux / Ubuntu / Debian / macOS / Windows Server) должен быть установлен **только Docker**:
- `docker` (v20.10+)
- `docker compose` (v2.0+)

Никаких локальных версий Python, Node.js, Nginx или PostgreSQL на сервере устанавливать **НЕ ТРЕБУЕТСЯ**.

---

## 🌐 2. Домен и Инфраструктура КГУ (`ivitsh-portal.kosgos.ru`)

Для развертывания проекта в локальной сети / интернете КГУ закреплен официальный домен 3-го уровня:
👉 **`ivitsh-portal.kosgos.ru`** (альтернативно: `portal.kosgos.ru` / `itschool.kosgos.ru`).

Nginx проксирует трафик следующим образом:
- **`https://ivitsh-portal.kosgos.ru/`** — Фронтенд (React SPA)
- **`https://ivitsh-portal.kosgos.ru/api/v1/*`** — FastAPI REST API Бэкенд
- **`https://ivitsh-portal.kosgos.ru/docs`** — Документация Swagger UI (активна при `DOCS_ENABLED=true`)

---

## 🚀 3. Пошаговая инструкция по развертыванию

### Шаг 1: Клонирование Git-репозитория
```bash
git clone https://github.com/qwerty-ll/CombinedPortal.git
cd CombinedPortal
```

### Шаг 2: Создание файла переменных окружения
Скопируйте пример файла конфигурации в корень:
```bash
cp .env.example .env
```
Укажите в `.env` файле учетные данные администратора и настройки:
```env
ADMIN_USERNAME=ivitsh_admin
ADMIN_PASSWORD=Ваш_Сложный_Пароль_2026!
SECRET_KEY=Ваш_Секретный_JWT_Ключ
DOCS_ENABLED=true
```

### Шаг 3: Переход в папку `infrastructure` и запуск контейнеров
```bash
cd infrastructure
docker compose up -d --build
```
*(Или из корня проекта без перехода: `docker compose -f infrastructure/docker-compose.yml up -d --build`)*

---

## 🛠️ 4. Разделение Образов (Docker Multicontainer Architecture)

В проекте используются **отдельные изолированные Docker-образы**:
1. **`infrastructure/docker/Dockerfile.client`**:
   - Мультистейдж сборка React Vite SPA на Node.js 20.
   - Минималистичный Nginx Alpine для отдачи статики и безопасной фильтрации трафика (CSP, HSTS).
2. **`infrastructure/docker/Dockerfile.server`**:
   - Python 3.11-slim с зависимостями FastAPI, Pydantic, SQLAlchemy, `httpx` и `bcrypt==3.2.2`.

---

## 🔐 5. Учетные данные Администратора

- **Вкладка авторизации**: **Личный кабинет** -> **Авторизоваться**
- **Управление доступом**: Все стандартные фолбэки выключены в целях безопасности. Логин и пароль администратора считываются строго из файла `.env` (`ADMIN_USERNAME` и `ADMIN_PASSWORD`).

---

## 🗄️ 6. База данных и Резервное копирование

1. База создается при первом старте в изолированном томе `sqlite_data`.
2. База работает в режиме **SQLite WAL (Write-Ahead Logging)** для высокой производительности.
3. При старте бэкенд автоматически сидирует список **17 официальных преподавателей ИВИТШ КГУ**.
4. **Бэкап базы данных**:
   ```bash
   docker cp ivitsh_portal_backend:/app/portal.db ./backup_portal_$(date +%Y%m%d).db
   ```

---

## 🔄 7. Команды обновления и управления

- **Автоматический пуш и мердж**:
  ```bash
  python3 push_and_merge.py
  ```
- **Просмотреть логи**: `docker compose logs -f`
- **Остановить сервер**: `docker compose down`
