import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.db.database import engine, Base
import app.core.security as security
from app.routers import auth, forum, chat, schedule, admin

import logging

load_dotenv()

# Configure Application Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ivitsh_portal")
logger.info("Initializing IVITSH KSU Portal Backend Services...")

# Initialize DB tables automatically on startup
Base.metadata.create_all(bind=engine)

def seed_database():
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(models.Teacher).count() == 0:
            teachers_seed = [
                {"name": "Киприна Людмила Юрьевна", "department": "Высшая ИТ-школа КГУ", "role": "Заведующая кафедрой, кандидат технических наук, доцент", "email": "L_kiprina@Kosgos.ru", "office": "г. Кострома, ул. Ивановская, 24А, каб.214", "hours": "Тел. 63-49-00 (доб. 8120)", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kiprina_lyu.jpg"},
                {"name": "Барило Илья Иванович", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/barilo_ii.jpg"},
                {"name": "Лустгартен Юрий Леонидович", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/lusgarten_yl.jpg"},
                {"name": "Красавина Мария Сергеевна", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/krasavina.jpg"},
                {"name": "Прядкина Нина Олеговна", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/pryadkina_no.jpg"},
                {"name": "Демчинова Екатерина Игоревна", "department": "Высшая ИТ-школа КГУ", "role": "Старший преподаватель кафедры", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/demchinova.jpg"},
                {"name": "Дорохова Жанна Викторовна", "department": "Высшая ИТ-школа КГУ", "role": "Старший преподаватель кафедры", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/dorohova.jpg"},
                {"name": "Орлов Александр Валерьевич", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/orlov.jpg"},
                {"name": "Мозохин Александр Евгеньевич", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/nophoto.jpg"},
                {"name": "Логинова Анна Александровна", "department": "Высшая ИТ-школа КГУ", "role": "Ассистент кафедры", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/loginova_aa.jpg"},
                {"name": "Силенок Юрий Викторович", "department": "Высшая ИТ-школа КГУ", "role": "Программист ООО 'Экзактпро'", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/silenok.jpg"},
                {"name": "Дружинина Ольга Васильевна", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/druzhinina.jpg"},
                {"name": "Кириллова Екатерина Сергеевна", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kirillova.jpg"},
                {"name": "Чувиляева Александра Сергеевна", "department": "Высшая ИТ-школа КГУ", "role": "Доцент кафедры, кандидат технических наук, доцент", "email": "", "office": "Корпус Б", "photo_url": "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/chuvilyaeva.jpg"}
            ]
            for t in teachers_seed:
                db.add(models.Teacher(**t))
            db.commit()
            logger.info(f"[DB SEED] Seeded {len(teachers_seed)} initial teachers into DB")

        if db.query(models.Subject).count() == 0:
            subjects_seed = [
                {"subject_code": "s1-algo", "name": "Алгоритмизация и программирование", "short_name": "Алгоритмы", "emoji": "⚙️", "color": "#34C759", "difficulty": 4, "hours": 144, "credits": 4, "semester": 1, "control_type": "Экзамен", "description": "Основы алгоритмического мышления, блок-схемы, базовые структуры управления и первые программы на C/Python.", "mascot_hack": "Мяу! Рисуй блок-схему ПЕРЕД тем, как писать код — это не трата времени, это экономия нервов 😸", "senior_advice": "Не пропускай практики — именно там разбирают задачи, которые потом будут на экзамене. Сдавай лабы вовремя."},
                {"subject_code": "s1-it", "name": "Информационные технологии", "short_name": "ИТ", "emoji": "🖥️", "color": "#007AFF", "difficulty": 3, "hours": 144, "credits": 4, "semester": 1, "control_type": "Экзамен", "extra_type": "Курсовая", "description": "Архитектура ПК, операционные системы, офисные пакеты, основы работы с сетями и базами данных.", "mascot_hack": "Курсовую начинай на 3-й неделе, а не за 3 дня до сдачи. Я видел, как студенты не спали 48 часов — не повторяй их ошибку 🙀", "senior_advice": "Курсовая работа — это твой первый серьёзный проект. Выбери тему, которая тебе интересна, и будет легче."},
                {"subject_code": "s1-informatics", "name": "Теоретические основы информатики", "short_name": "ТОИ", "emoji": "🔢", "color": "#5856D6", "difficulty": 4, "hours": 144, "credits": 4, "semester": 1, "control_type": "Экзамен", "description": "Системы счисления, булева алгебра, теория информации, кодирование и сжатие данных.", "mascot_hack": "Перевод из двоичной в шестнадцатеричную — через группы по 4 бита. Запомни это и половина задач решена! 😹", "senior_advice": "Этот предмет — фундамент. Не игнорируй теорию: она всплывёт на 2-м курсе в самый неожиданный момент."},
                {"subject_code": "s1-calculus", "name": "Математический анализ", "short_name": "Матан", "emoji": "∫", "color": "#007AFF", "difficulty": 5, "hours": 108, "credits": 3, "semester": 1, "control_type": "Зачет", "description": "Пределы, производные, интегралы. Фундамент высшей математики и основа для машинного обучения.", "mascot_hack": "Выучи таблицу производных наизусть — это 40% задач. Остальное выводится из правил дифференцирования 😹", "senior_advice": "Решай задачи каждый день — хотя бы по 3 штуки. Не копи долги до сессии, иначе будет очень больно."},
                {"subject_code": "s2-algods", "name": "Алгоритмы и структуры данных", "short_name": "АиСД", "emoji": "🌳", "color": "#34C759", "difficulty": 5, "hours": 144, "credits": 4, "semester": 2, "control_type": "Экзамен", "description": "Сортировки, деревья, графы, хэш-таблицы, сложность алгоритмов O(n). Основа для любых собеседований.", "mascot_hack": "O(n log n) — это быстрая сортировка. Запомни: если задача про поиск — думай про бинарный поиск первым 🐱‍💻", "senior_advice": "Это самый важный предмет для карьеры программиста. Решай задачи на LeetCode параллельно с учёбой."},
                {"subject_code": "s2-linalg", "name": "Линейная алгебра", "short_name": "Линал", "emoji": "🔢", "color": "#5856D6", "difficulty": 4, "hours": 144, "credits": 4, "semester": 2, "control_type": "Экзамен", "description": "Матрицы, определители, собственные значения, линейные пространства. Основа для ML и компьютерной графики.", "mascot_hack": "Определитель 2×2 — это ad-bc. Визуализируй матрицы как трансформации пространства — сразу станет понятнее 😹", "senior_advice": "Смотри 3Blue1Brown «Essence of Linear Algebra» на YouTube — лучшее объяснение в мире, бесплатно."}
            ]
            for s in subjects_seed:
                db.add(models.Subject(**s))
            db.commit()
            logger.info(f"[DB SEED] Seeded {len(subjects_seed)} initial subjects into DB")
    except Exception as e:
        logger.warning(f"[DB SEED WARN] Could not seed database: {e}")
    finally:
        db.close()

seed_database()

app = FastAPI(
    title="Портал ИВИТШ КГУ API",
    description="Официальный REST API для сайта-портала и гайда адаптации первокурсников Высшей ИТ-Школы КГУ",
    version="1.0.0"
)

# CORS configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()] if allowed_origins_env else [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://combined-portal-freshman.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Router Modules
app.include_router(auth.router)
app.include_router(forum.router)
app.include_router(chat.router)
app.include_router(schedule.router)
app.include_router(admin.router)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "IVITSH Portal Backend API"}

@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Портал ИВИТШ КГУ API</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #F8F9FA; color: #1C1E21; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; max-width: 480px; }
          h1 { color: #007FFF; margin-top: 0; }
          .btn { display: inline-block; margin-top: 20px; padding: 14px 28px; background: #007FFF; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 REST API ИВИТШ КГУ</h1>
          <p>Сервер бэкенда работает штатно на порту 8000.</p>
          <a href="/docs" class="btn">Документация Swagger (/docs) ↗</a>
        </div>
      </body>
    </html>
    """

# Serve static frontend build if folder exists (Production Container)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        safe_base = os.path.abspath(static_dir)
        requested_path = os.path.abspath(os.path.join(static_dir, full_path))
        if not requested_path.startswith(safe_base):
            raise HTTPException(status_code=403, detail="Доступ запрещен")

        if os.path.exists(requested_path) and os.path.isfile(requested_path):
            return FileResponse(requested_path)
        return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
