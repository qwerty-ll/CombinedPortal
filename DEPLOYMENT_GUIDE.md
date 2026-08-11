# 🚀 Руководство по Деплою Портала ИВИТШ КГУ на Виртуальную Машину (VM / VDS)

Настоящее руководство предназначено для системных администраторов ИВИТШ КГУ и описывает процесс переноса, разворачивания и интеграции Портала на виртуальном сервере под управлением Linux (Ubuntu / Debian / CentOS).

---

## 📋 1. Системные Требования к ВМ

- **ОС**: Ubuntu 22.04 LTS / Debian 12 (рекомендуется)
- **CPU**: 2 ядра
- **RAM**: от 4 ГБ
- **Диск**: от 20 ГБ SSD
- **Установленное ПО**: `docker`, `docker-compose-plugin`, `git`

---

## 🛠️ 2. Шаг 1: Перенос проекта на сервер

### Вариант А: Через Git (Рекомендуется)
Подключитесь к виртуальной машине по SSH и склонируйте репозиторий:
```bash
git clone https://github.com/qwerty-ll/CombinedPortal.git /opt/ivitsh-portal
cd /opt/ivitsh-portal
```

### Вариант Б: Перенос архивом ZIP
Если на сервере нет доступа к GitHub:
1. Заархивируйте папку проекта на компьютере.
2. Скопируйте архив на сервер через SCP:
   ```bash
   scp CombinedPortal.zip user@YOUR_SERVER_IP:/opt/
   ```
3. Распакуйте на сервере:
   ```bash
   cd /opt && unzip CombinedPortal.zip -d ivitsh-portal
   cd ivitsh-portal
   ```

---

## ⚡ 3. Шаг 2: Настройка переменных окружения

В корневой директории создайте файл `.env`:
```bash
cp backend/.env .env 2>/dev/null || touch .env
```

Отредактируйте `.env`:
```env
# База данных PostgreSQL (контейнер db разворачивается автоматически)
DATABASE_URL=postgresql://ivitsh_user:KguPortalSecure2026Password!@db:5432/portal_db

# JWT Секретный ключ (сгенерируйте случайную строку)
SECRET_KEY=ksu_ivitsh_production_jwt_super_secret_key_2026_secure
ALGORITHM=HS256

# GigaChat API (Сбер)
GIGACHAT_CLIENT_ID=019e2c26-97a8-75cf-8d25-1caf90fcdd51
GIGACHAT_SECRET=MDE5ZTJjMjYtOTdhOC03NWNmLThkMjUtMWNhZjkwZmNkZDUxOjFkODQ2YzZjLTgwNmEtNGIwZi1iZmQ2LTY0Zjg2NTAwMmU2Yg==
```

---

## 🐳 4. Шаг 3: Запуск проекта одной командой (Docker Compose)

Выполните сборку и запуск всех сервисов (PostgreSQL, FastAPI Backend, React Frontend и Nginx):
```bash
docker compose up -d --build
```

Проверьте статус запущенных контейнеров:
```bash
docker compose ps
```
Должны отображаться 3 активных контейнера:
- `ivitsh_portal_db` (PostgreSQL 16)
- `ivitsh_portal_backend` (FastAPI)
- `ivitsh_portal_nginx` (Nginx на порту 80)

---

## 🔒 5. Шаг 4: Настройка SSL сертификата (HTTPS)

Для подключения домена (например, `freshman.kosgos.ru`) установите бесплатный SSL-сертификат Let's Encrypt через Certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d freshman.kosgos.ru
```
Certbot автоматически обновит `nginx.conf` и настроит перенаправление с HTTP на HTTPS.

---

## 🔑 6. Учетные Записи По Умолчанию

- **Суперадминистратор**: `ivitsh_admin` / `KGU_IVITSH_Admin_2026!#Secure`
- **Логин тестового студента СДО**: `24-isbo-085` / `Register21-SDO@`
- **Swagger Документация API**: `http://YOUR_SERVER_IP/docs`

---

## 📊 7. Полезные Команды для Обслуживания

- **Просмотр логов бэкенда**:
  ```bash
  docker compose logs -f backend
  ```
- **Перезапуск сервисов**:
  ```bash
  docker compose restart
  ```
- **Обновление проекта из Git**:
  ```bash
  git pull
  docker compose up -d --build
  ```
