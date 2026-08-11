import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import requests

from database import engine, Base, get_db
import models
import schemas
import auth
from rag_service import generate_chatbot_reply

load_dotenv()

# Initialize DB tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Портал ИВИТШ КГУ API",
    description="Официальный REST API для сайта-портала и гайда адаптации первокурсников Высшей ИТ-Школы КГУ",
    version="1.0.0"
)

# CORS setup for Vite frontend (localhost:5173 / localhost:3000 / Vercel domains)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://combined-portal-freshman.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import HTMLResponse

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

# ==========================================
# 1. AUTHENTICATION & PROFILES
# ==========================================

@app.post("/api/v1/auth/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    hashed_pw = auth.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        group_number=user_in.group_number,
        hashed_password=hashed_pw,
        role=user_in.role or "student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(data={"sub": new_user.username})
    return schemas.TokenResponse(access_token=token, user=new_user)

@app.post("/api/v1/auth/admin-login", response_model=schemas.TokenResponse)
def admin_login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    admin_user_env = os.getenv("ADMIN_USERNAME", "ivitsh_admin")
    admin_pass_env = os.getenv("ADMIN_PASSWORD", "KGU_IVITSH_Admin_2026!#Secure")

    username_clean = user_in.username.strip().lower()
    
    # Check if superadmin credentials match environment configuration or predefined admin logins
    is_env_admin = (username_clean == admin_user_env.lower() or username_clean in ("admin", "smirnovmakar")) and user_in.password == admin_pass_env

    db_user = db.query(models.User).filter(models.User.username == user_in.username.strip()).first()
    
    if not is_env_admin and db_user:
        if db_user.role not in ("admin", "moderator") or not auth.verify_password(user_in.password, db_user.hashed_password):
            raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")
    elif not is_env_admin and not db_user:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")

    if not db_user:
        hashed_pw = auth.get_password_hash(user_in.password)
        db_user = models.User(
            username=user_in.username.strip(),
            full_name="Администратор ИВИТШ КГУ",
            group_number="Деканат ИВИТШ",
            hashed_password=hashed_pw,
            role="admin"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        if db_user.role != "admin":
            db_user.role = "admin"
            db.commit()
            db.refresh(db_user)

    token = auth.create_access_token(data={"sub": db_user.username})
    return schemas.TokenResponse(access_token=token, user=db_user)

@app.get("/api/v1/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

@app.patch("/api/v1/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    req: schemas.RoleUpdateSchema,
    current_user: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    if req.role not in ("student", "moderator", "admin"):
        raise HTTPException(status_code=400, detail="Недопустимая роль. Используйте: student, moderator, admin")
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    target_user.role = req.role
    db.commit()
    db.refresh(target_user)
    return target_user

    token = auth.create_access_token(data={"sub": db_user.username})
    return schemas.TokenResponse(access_token=token, user=db_user)

@app.post("/api/v1/auth/sdo-login", response_model=schemas.TokenResponse)
def sdo_login(sdo_req: schemas.SdoLoginRequest, db: Session = Depends(get_db)):
    username = sdo_req.username.strip()
    password = sdo_req.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Логин и пароль обязательны для входа через СДО")

    # 1. Query Moodle Mobile token from sdo.kosgos.ru
    token_url = "https://sdo.kosgos.ru/login/token.php"
    token_params = {
        "username": username,
        "password": password,
        "service": "moodle_mobile_app"
    }

    try:
        token_resp = requests.get(token_url, params=token_params, timeout=12, verify=False)
        token_data = token_resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка соединения с сервером СДО КГУ: {str(e)}")

    if "error" in token_data or "token" not in token_data:
        err_msg = token_data.get("error", "Неверный логин или пароль СДО")
        raise HTTPException(status_code=400, detail=err_msg)

    wstoken = token_data["token"]

    # 2. Query user profile info (core_webservice_get_site_info)
    rest_url = "https://sdo.kosgos.ru/webservice/rest/server.php"
    info_params = {
        "wstoken": wstoken,
        "moodlewsrestformat": "json",
        "wsfunction": "core_webservice_get_site_info"
    }

    try:
        info_resp = requests.post(rest_url, data=info_params, timeout=12, verify=False)
        info_data = info_resp.json()
    except Exception:
        info_data = {}

    fullname = info_data.get("fullname", "").strip() or info_data.get("username", "").strip() or username
    userid = info_data.get("userid")
    userpictureurl = info_data.get("userpictureurl", "")
    department_name = ""

    # Query detailed Moodle user profile if userid is available (core_user_get_users_by_field)
    if userid:
        try:
            u_params = {
                "wstoken": wstoken,
                "moodlewsrestformat": "json",
                "wsfunction": "core_user_get_users_by_field",
                "field": "id",
                "values[0]": userid
            }
            u_resp = requests.post(rest_url, data=u_params, timeout=8, verify=False)
            u_json = u_resp.json()
            if isinstance(u_json, list) and len(u_json) > 0:
                u_item = u_json[0]
                u_fn = u_item.get("fullname") or f"{u_item.get('lastname', '')} {u_item.get('firstname', '')}".strip()
                if u_fn and u_fn.lower() != username.lower():
                    fullname = u_fn
                if u_item.get("profileimageurl"):
                    userpictureurl = u_item.get("profileimageurl")
                if u_item.get("department"):
                    department_name = u_item.get("department")
        except Exception:
            pass

    # Only fallback to EIOS API if Moodle fullname is missing or equals raw username
    if not fullname or fullname.lower() == username.lower() or " " not in fullname:
        try:
            eios_resp = requests.post(
                "https://eios.kosgos.ru/api/tokenauth",
                json={"userName": username, "password": password},
                timeout=6,
                verify=False
            )
            eios_json = eios_resp.json()
            if eios_json.get("state") == 1 and eios_json.get("data"):
                data_inner = eios_json["data"].get("data", {})
                eios_fio = data_inner.get("userName") or data_inner.get("fullName") or data_inner.get("shortFIO")
                if eios_fio and eios_fio.lower() != username.lower():
                    fullname = eios_fio
        except Exception:
            pass

    # 3. Query user courses if userid is available (core_enrol_get_users_courses / timeline)
    courses_list = []
    detected_group = sdo_req.group_number.strip() if sdo_req.group_number else ""

    if userid:
        course_params = {
            "wstoken": wstoken,
            "moodlewsrestformat": "json",
            "wsfunction": "core_enrol_get_users_courses",
            "userid": userid,
            "returnusercount": 0
        }
        try:
            course_resp = requests.post(rest_url, data=course_params, timeout=12, verify=False)
            course_json = course_resp.json()
            if isinstance(course_json, list) and len(course_json) > 0:
                courses_list = [
                    {
                        "id": c.get("id"),
                        "fullname": c.get("fullname"),
                        "shortname": c.get("shortname"),
                        "progress": c.get("progress", 0)
                    }
                    for c in course_json
                ]
            else:
                # Fallback to core_course_get_enrolled_courses_by_timeline_classification
                t_params = {
                    "wstoken": wstoken,
                    "moodlewsrestformat": "json",
                    "wsfunction": "core_course_get_enrolled_courses_by_timeline_classification",
                    "classification": "all"
                }
                t_resp = requests.post(rest_url, data=t_params, timeout=12, verify=False)
                t_json = t_resp.json()
                if isinstance(t_json, dict) and "courses" in t_json:
                    courses_list = [
                        {
                            "id": c.get("id"),
                            "fullname": c.get("fullname"),
                            "shortname": c.get("shortname"),
                            "progress": c.get("progress", 0)
                        }
                        for c in t_json["courses"]
                    ]

            # Auto-detect group pattern like 24-ИСбо-1 or 25-ИСбо-1 from course names if not provided
            if not detected_group and courses_list:
                import re
                for c in courses_list:
                    match = re.search(r'\b(\d{2}-[А-Яа-яA-Za-z]+-\d+)\b', c.get("fullname", "") + " " + c.get("shortname", ""))
                    if match:
                        detected_group = match.group(1)
                        break
        except Exception:
            courses_list = []

    if not detected_group:
        detected_group = department_name or "24-ИСбо-1"

    # Determine assigned role (admin logins or student)
    ADMIN_USERNAMES = {"admin", "smirnovmakar", "moderator"}
    assigned_role = "admin" if username.lower() in ADMIN_USERNAMES else "student"

    # 4. Sync with local database User record
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        hashed_pw = auth.get_password_hash(password)
        db_user = models.User(
            username=username,
            full_name=fullname,
            group_number=detected_group,
            hashed_password=hashed_pw,
            role=assigned_role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        if fullname and db_user.full_name != fullname:
            db_user.full_name = fullname
        if detected_group and db_user.group_number != detected_group:
            db_user.group_number = detected_group
        if username.lower() in ADMIN_USERNAMES:
            db_user.role = "admin"
        db.commit()

    # 5. Create local access token & return payload with SDO attributes
    jwt_token = auth.create_access_token(data={"sub": db_user.username})

    user_resp = schemas.UserResponse(
        id=db_user.id,
        username=db_user.username,
        full_name=db_user.full_name,
        role=db_user.role,
        group_number=db_user.group_number,
        email=db_user.email,
        sdo_token=wstoken,
        userpictureurl=userpictureurl,
        courses=courses_list,
        created_at=db_user.created_at
    )

    return schemas.TokenResponse(access_token=jwt_token, user=user_resp)

@app.get("/api/v1/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.require_current_user)):
    return current_user

# ==========================================
# 2. STUDENT FORUM
# ==========================================

@app.get("/api/v1/forum/questions", response_model=List[schemas.ForumQuestionResponse])
def get_forum_questions(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ForumQuestion)
    if category and category != "Все":
        query = query.filter(models.ForumQuestion.category == category)
    if search:
        query = query.filter(
            (models.ForumQuestion.title.ilike(f"%{search}%")) | 
            (models.ForumQuestion.content.ilike(f"%{search}%"))
        )

    questions = query.order_by(models.ForumQuestion.is_pinned.desc(), models.ForumQuestion.created_at.desc()).all()

    result = []
    for q in questions:
        upvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == 1).count()
        downvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == -1).count()
        answers_count = db.query(models.ForumAnswer).filter(models.ForumAnswer.question_id == q.id).count()

        user_vote = 0
        if current_user:
            v = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.user_id == current_user.id).first()
            if v:
                user_vote = v.vote_type

        result.append(schemas.ForumQuestionResponse(
            id=q.id,
            author_id=q.author_id,
            author_name=q.author.full_name,
            title=q.title,
            category=q.category,
            content=q.content,
            views_count=q.views_count,
            votes_count=upvotes - downvotes,
            answers_count=answers_count,
            user_vote=user_vote,
            is_pinned=q.is_pinned,
            created_at=q.created_at
        ))
    return result

@app.post("/api/v1/forum/questions", response_model=schemas.ForumQuestionResponse)
def create_question(
    q_in: schemas.ForumQuestionCreate,
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    new_q = models.ForumQuestion(
        author_id=current_user.id,
        title=q_in.title,
        category=q_in.category,
        content=q_in.content
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    return schemas.ForumQuestionResponse(
        id=new_q.id,
        author_id=new_q.author_id,
        author_name=current_user.full_name,
        title=new_q.title,
        category=new_q.category,
        content=new_q.content,
        views_count=0,
        votes_count=0,
        answers_count=0,
        user_vote=0,
        is_pinned=False,
        created_at=new_q.created_at
    )

@app.get("/api/v1/forum/questions/{question_id}", response_model=schemas.ForumQuestionResponse)
def get_question_detail(
    question_id: int,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.ForumQuestion).filter(models.ForumQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=440, detail="Вопрос не найден")

    q.views_count += 1
    db.commit()

    upvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == 1).count()
    downvotes = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.vote_type == -1).count()
    answers_count = db.query(models.ForumAnswer).filter(models.ForumAnswer.question_id == q.id).count()

    user_vote = 0
    if current_user:
        v = db.query(models.Vote).filter(models.Vote.question_id == q.id, models.Vote.user_id == current_user.id).first()
        if v:
            user_vote = v.vote_type

    return schemas.ForumQuestionResponse(
        id=q.id,
        author_id=q.author_id,
        author_name=q.author.full_name,
        title=q.title,
        category=q.category,
        content=q.content,
        views_count=q.views_count,
        votes_count=upvotes - downvotes,
        answers_count=answers_count,
        user_vote=user_vote,
        is_pinned=q.is_pinned,
        created_at=q.created_at
    )

@app.get("/api/v1/forum/questions/{question_id}/answers", response_model=List[schemas.ForumAnswerResponse])
def get_question_answers(question_id: int, db: Session = Depends(get_db)):
    answers = db.query(models.ForumAnswer).filter(models.ForumAnswer.question_id == question_id).order_by(models.ForumAnswer.created_at.asc()).all()
    return [
        schemas.ForumAnswerResponse(
            id=a.id,
            question_id=a.question_id,
            author_id=a.author_id,
            author_name=a.author.full_name,
            content=a.content,
            is_solution=a.is_solution,
            created_at=a.created_at
        )
        for a in answers
    ]

@app.post("/api/v1/forum/questions/{question_id}/answers", response_model=schemas.ForumAnswerResponse)
def post_answer(
    question_id: int,
    ans_in: schemas.ForumAnswerCreate,
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(models.ForumQuestion).filter(models.ForumQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Вопрос не найден")

    new_ans = models.ForumAnswer(
        question_id=question_id,
        author_id=current_user.id,
        content=ans_in.content
    )
    db.add(new_ans)
    db.commit()
    db.refresh(new_ans)

    return schemas.ForumAnswerResponse(
        id=new_ans.id,
        question_id=new_ans.question_id,
        author_id=new_ans.author_id,
        author_name=current_user.full_name,
        content=new_ans.content,
        is_solution=False,
        created_at=new_ans.created_at
    )

@app.post("/api/v1/forum/questions/{question_id}/vote")
def vote_question(
    question_id: int,
    req: schemas.VoteRequest,
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    vote = db.query(models.Vote).filter(models.Vote.question_id == question_id, models.Vote.user_id == current_user.id).first()
    if vote:
        if vote.vote_type == req.vote_type:
            db.delete(vote)
        else:
            vote.vote_type = req.vote_type
    else:
        new_vote = models.Vote(user_id=current_user.id, question_id=question_id, vote_type=req.vote_type)
        db.add(new_vote)
    db.commit()
    return {"status": "ok"}

# ==========================================
# 3. AI CHATBOT & ANALYTICS
# ==========================================

@app.post("/api/v1/chat", response_model=schemas.ChatResponse)
def chat_with_mascot(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    history_list = [h.dict() for h in (req.history or [])]
    reply = generate_chatbot_reply(req.message, history_list, db)
    return schemas.ChatResponse(reply=reply)

@app.get("/api/v1/chat/top-questions", response_model=List[str])
def get_top_analytics_questions(db: Session = Depends(get_db)):
    top = db.query(models.AnalyticsQuestion).order_by(models.AnalyticsQuestion.ask_count.desc()).limit(5).all()
    if not top:
        return ["Где расписание?", "Как найти 209 кабинет?", "Про стипендию ИВИТШ", "Где коворкинг?"]
    return [q.question_text for q in top]

# ==========================================
# 4. ADMIN & DYNAMIC CONTENT
# ==========================================

@app.get("/api/v1/teachers", response_model=List[schemas.TeacherResponse])
def get_teachers(db: Session = Depends(get_db)):
    return db.query(models.Teacher).all()

@app.post("/api/v1/admin/teachers", response_model=schemas.TeacherResponse)
def create_teacher(t_in: schemas.TeacherCreate, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    new_t = models.Teacher(**t_in.dict())
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

@app.delete("/api/v1/admin/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    t = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if t:
        db.delete(t)
        db.commit()
    return {"status": "deleted"}

@app.get("/api/v1/announcements", response_model=List[schemas.AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@app.post("/api/v1/admin/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(a_in: schemas.AnnouncementCreate, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    new_a = models.Announcement(**a_in.dict())
    db.add(new_a)
    db.commit()
    db.refresh(new_a)
    return new_a

@app.delete("/api/v1/admin/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if a:
        db.delete(a)
        db.commit()
    return {"status": "deleted"}

@app.get("/api/v1/faq", response_model=List[schemas.FaqItemResponse])
def get_faq_items(db: Session = Depends(get_db)):
    return db.query(models.FaqItem).order_by(models.FaqItem.order_index.asc()).all()

@app.post("/api/v1/admin/faq", response_model=schemas.FaqItemResponse)
def create_faq_item(f_in: schemas.FaqItemCreate, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    new_f = models.FaqItem(**f_in.dict())
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return new_f

@app.delete("/api/v1/admin/faq/{faq_id}")
def delete_faq_item(faq_id: int, current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    f = db.query(models.FaqItem).filter(models.FaqItem.id == faq_id).first()
    if f:
        db.delete(f)
        db.commit()
    return {"status": "deleted"}

# ==========================================
# 5. EIOS KSU SCHEDULE API PROXY
# ==========================================

EIOS_BASE_URL = "https://eios.kosgos.ru/api"

@app.get("/api/v1/schedule/years")
def get_eios_years():
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/Rasp/ListYears", timeout=10, verify=False)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"data": {"years": ["2025-2026", "2024-2025"]}, "state": 1}

@app.get("/api/v1/schedule/groups")
def get_eios_groups(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspGrouplist", params={"year": year}, timeout=10, verify=False)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"data": [], "error": str(e)}

@app.get("/api/v1/schedule/teachers")
def get_eios_teachers(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspTeacherlist", params={"year": year}, timeout=10, verify=False)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"data": [], "error": str(e)}

@app.get("/api/v1/schedule/auditories")
def get_eios_auditories(year: str = Query("2025-2026")):
    try:
        resp = requests.get(f"{EIOS_BASE_URL}/raspAudlist", params={"year": year}, timeout=10, verify=False)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"data": [], "error": str(e)}

@app.get("/api/v1/schedule/rasp")
def get_eios_rasp(
    idGroup: Optional[int] = Query(None),
    idTeacher: Optional[int] = Query(None),
    idAud: Optional[int] = Query(None),
    year: str = Query("2025-2026"),
    sdate: Optional[str] = Query(None)
):
    try:
        params = {"year": year}
        if idGroup: params["idGroup"] = idGroup
        if idTeacher: params["idTeacher"] = idTeacher
        if idAud: params["idAud"] = idAud
        if sdate: params["sdate"] = sdate
        
        resp = requests.get(f"{EIOS_BASE_URL}/Rasp", params=params, timeout=15, verify=False)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"data": {"rasp": []}, "error": str(e)}
