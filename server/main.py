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
