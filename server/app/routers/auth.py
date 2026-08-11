import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
import app.models as models
import app.schemas as schemas
import app.core.security as security

try:
    import httpx
except ImportError:
    import requests as httpx

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    username_clean = user_in.username.strip()
    if not username_clean or len(username_clean) < 3:
        raise HTTPException(status_code=400, detail="Логин должен содержать минимум 3 символа")
    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть длиной не менее 6 символов")

    db_user = db.query(models.User).filter(models.User.username == username_clean).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    hashed_pw = security.get_password_hash(user_in.password)
    new_user = models.User(
        username=username_clean,
        full_name=user_in.full_name,
        email=user_in.email,
        group_number=user_in.group_number,
        hashed_password=hashed_pw,
        role=user_in.role or "student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = security.create_access_token(data={"sub": new_user.username})
    return schemas.TokenResponse(access_token=token, user=new_user)

@router.post("/admin-login", response_model=schemas.TokenResponse)
def admin_login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    admin_user_env = os.getenv("ADMIN_USERNAME", "ivitsh_admin")
    admin_pass_env = os.getenv("ADMIN_PASSWORD", "KGU_IVITSH_Admin_2026!#Secure")

    username_clean = user_in.username.strip().lower()
    is_env_admin = (username_clean == admin_user_env.lower() or username_clean in ("admin", "smirnovmakar")) and user_in.password == admin_pass_env

    db_user = db.query(models.User).filter(models.User.username == user_in.username.strip()).first()
    
    if not is_env_admin and db_user:
        if db_user.role not in ("admin", "moderator") or not security.verify_password(user_in.password, db_user.hashed_password):
            raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")
    elif not is_env_admin and not db_user:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")

    if not db_user:
        hashed_pw = security.get_password_hash(user_in.password)
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

    token = security.create_access_token(data={"sub": db_user.username})
    return schemas.TokenResponse(access_token=token, user=db_user)

@router.post("/sdo-login", response_model=schemas.TokenResponse)
async def sdo_login(sdo_req: schemas.SdoLoginRequest, db: Session = Depends(get_db)):
    username = sdo_req.username.strip()
    password = sdo_req.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Логин и пароль обязательны для входа через СДО")

    token_url = "https://sdo.kosgos.ru/login/token.php"
    token_params = {
        "username": username,
        "password": password,
        "service": "moodle_mobile_app"
    }

    async with httpx.AsyncClient(verify=security.VERIFY_SSL, timeout=12.0) as client:
        try:
            token_resp = await client.get(token_url, params=token_params)
            token_data = token_resp.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Ошибка соединения с сервером СДО КГУ: {str(e)}")

        if "error" in token_data or "token" not in token_data:
            err_msg = token_data.get("error", "Неверный логин или пароль СДО")
            raise HTTPException(status_code=400, detail=err_msg)

        wstoken = token_data["token"]
        rest_url = "https://sdo.kosgos.ru/webservice/rest/server.php"
        info_params = {
            "wstoken": wstoken,
            "moodlewsrestformat": "json",
            "wsfunction": "core_webservice_get_site_info"
        }

        try:
            info_resp = await client.post(rest_url, data=info_params)
            info_data = info_resp.json()
        except Exception:
            info_data = {}

        fullname = info_data.get("fullname", "").strip() or info_data.get("username", "").strip() or username
        userid = info_data.get("userid")
        userpictureurl = info_data.get("userpictureurl", "")
        department_name = ""

        if userid:
            try:
                u_params = {
                    "wstoken": wstoken,
                    "moodlewsrestformat": "json",
                    "wsfunction": "core_user_get_users_by_field",
                    "field": "id",
                    "values[0]": userid
                }
                u_resp = await client.post(rest_url, data=u_params)
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
                course_resp = await client.post(rest_url, data=course_params)
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
                    t_params = {
                        "wstoken": wstoken,
                        "moodlewsrestformat": "json",
                        "wsfunction": "core_course_get_enrolled_courses_by_timeline_classification",
                        "classification": "all"
                    }
                    t_resp = await client.post(rest_url, data=t_params)
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

    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        hashed_pw = security.get_password_hash(password)
        db_user = models.User(
            username=username,
            full_name=fullname,
            group_number=detected_group,
            hashed_password=hashed_pw,
            role="student"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        if fullname and db_user.full_name != fullname:
            db_user.full_name = fullname
        if detected_group and db_user.group_number != detected_group:
            db_user.group_number = detected_group
        db.commit()

    jwt_token = security.create_access_token(data={"sub": db_user.username})

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

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(security.require_current_user)):
    return current_user
