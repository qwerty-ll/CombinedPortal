# 🚀 Руководство по Легковесному Деплою Портала ИВИТШ КГУ на Виртуальную Машину (Standalone / Offline DB)

Данное руководство описывает **полностью автономный запуск** портала на любой виртуальной машине Linux без необходимости устанавливать или подключать внешние СУБД (PostgreSQL / MySQL). 

Вся система работает локально «из коробки» благодаря высокопроизводительному файловому движку **SQLite в режиме WAL (Write-Ahead Logging)**.

---

## 📋 1. Системные Требования

- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS
- **CPU**: 1-2 ядра
- **RAM**: от 2 ГБ
- **Диск**: от 10 ГБ SSD
- **Установленное ПО**: `docker`, `docker-compose-plugin`, `git`

---

## 🛠️ 2. Шаг 1: Перенос проекта на сервер

### Вариант А: Через Git
```bash
git clone https://github.com/qwerty-ll/CombinedPortal.git /opt/ivitsh-portal
cd /opt/ivitsh-portal
```

### Вариант Б: Перенос ZIP-архивом (если нет интернета/гита)
1. Скопируйте ZIP архив проекта на сервер через SFTP.
2. Распакуйте:
   ```bash
   cd /opt && unzip CombinedPortal.zip -d ivitsh-portal
   cd ivitsh-portal
   ```

---

## ⚡ 3. Шаг 2: Переменные Окружения (`.env`)

Создайте файл `.env` (или оставьте значения по умолчанию):
```env
# Локальная база данных SQLite (файл создается автоматически на диске)
DATABASE_URL=sqlite:///./portal.db

# JWT Секретный ключ авторизации
SECRET_KEY=ksu_ivitsh_production_jwt_super_secret_key_2026_secure
ALGORITHM=HS256

# GigaChat API (Сбер)
GIGACHAT_CLIENT_ID=019e2c26-97a8-75cf-8d25-1caf90fcdd51
GIGACHAT_SECRET=MDE5ZTJjMjYtOTdhOC03NWNmLThkMjUtMWNhZjkwZmNkZDUxOjFkODQ2YzZjLTgwNmEtNGIwZi1iZmQ2LTY0Zjg2NTAwMmU2Yg==
```

---

## 🐳 4. Шаг 3: Запуск 1 командой (Docker Compose)

Запустите контейнеры приложения и веб-сервера:
```bash
docker compose up -d --build
```

Проверьте статус:
```bash
docker compose ps
```
Должны работать 2 легких контейнера:
- `ivitsh_portal_backend` (FastAPI + SQLite WAL mode)
- `ivitsh_portal_nginx` (Nginx на порту 80)

---

## 🔒 5. Особенности локальной базы данных SQLite (WAL mode)

- **Нулевая сложность**: Не нужно создавать пользователей БД, логины или пароли к СУБД.
- **Высокое параллельное чтение**: Включен режим `PRAGMA journal_mode=WAL;`, который позволяет параллельно читать и записывать данные без блокировки файлов.
- **Резервное копирование**: Для бекапа всей базы данных достаточно просто скопировать файл `portal.db`.

---

## 🔑 6. Данные по умолчанию

- **Суперадминистратор**: `ivitsh_admin` / `KGU_IVITSH_Admin_2026!#Secure`
- **Тестовый студент СДО**: `24-isbo-085` / `Register21-SDO@`
- **Документация API**: `http://IP_ВАШЕЙ_ВМ/docs`
