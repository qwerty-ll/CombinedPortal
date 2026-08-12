import os
import logging
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

logger = logging.getLogger("ivitsh_portal.auth")
logger.setLevel(logging.INFO)

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
    logger.info(f"[REGISTER SUCCESS] New user registered: {new_user.username}")
    return schemas.TokenResponse(access_token=token, user=new_user)

@router.post("/admin-login", response_model=schemas.TokenResponse)
def admin_login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    admin_user_env = os.getenv("ADMIN_USERNAME", "ivitsh_admin")
    admin_pass_env = os.getenv("ADMIN_PASSWORD", "KGU_IVITSH_Admin_2026!")

    username_clean = user_in.username.strip().lower()
    is_env_admin = (username_clean == admin_user_env.lower() or username_clean in ("admin", "smirnovmakar")) and user_in.password == admin_pass_env

    db_user = db.query(models.User).filter(models.User.username == user_in.username.strip()).first()
    
    if not is_env_admin and db_user:
        if db_user.role not in ("admin", "moderator") or not security.verify_password(user_in.password, db_user.hashed_password):
            logger.warning(f"[ADMIN LOGIN FAILED] Invalid admin password for user: {user_in.username}")
            raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")
    elif not is_env_admin and not db_user:
        logger.warning(f"[ADMIN LOGIN FAILED] User not found: {user_in.username}")
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
    logger.info(f"[ADMIN LOGIN SUCCESS] Admin logged in: {db_user.username}")
    return schemas.TokenResponse(access_token=token, user=db_user)

@router.post("/sdo-login", response_model=schemas.TokenResponse)
async def sdo_login(sdo_req: schemas.SdoLoginRequest, db: Session = Depends(get_db)):
    username = sdo_req.username.strip()
    password = sdo_req.password.strip()

    logger.info(f"[SDO LOGIN ATTEMPT] Initiating SDO authentication for user: {username}")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Логин и пароль обязательны для входа через СДО")

    token_url = "https://sdo.kosgos.ru/login/token.php"
    token_params = {
        "username": username,
        "password": password,
        "service": "moodle_mobile_app"
    }

    # Attempt SDO authentication (with fallback SSL verification to support internal KSU network)
    token_data = None
    wstoken = None
    verify_ssl_setting = security.VERIFY_SSL

    # Helper to safely parse EIOS/SDO token response and detect VPN / 451 blocks
    def process_token_response(resp):
        if resp.status_code == 451 or "отключите vpn" in resp.text.lower() or "правовыми ограничениями" in resp.text.lower():
            logger.warning("[EIOS/SDO VPN BLOCK] eios.kosgos.ru / sdo.kosgos.ru returned 451 VPN Block")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Сервер ЭИОС КГУ заблокировал подключение из-за включенного VPN. Пожалуйста, отключите VPN на компьютере или в браузере и повторите попытку."
            )
        try:
            return resp.json()
        except Exception as json_err:
            logger.error(f"[EIOS/SDO NON-JSON RESP] HTTP {resp.status_code}: {resp.text[:200]}")
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Сервер ЭИОС КГУ недоступен (код ошибки {resp.status_code})."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Сервер ЭИОС КГУ вернул некорректный ответ."
            )

    import requests as sync_requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    try:
        # First attempt with standard SSL verification setting
        resp = sync_requests.get(token_url, params=token_params, verify=verify_ssl_setting, timeout=8.0)
        token_data = process_token_response(resp)
    except HTTPException:
        raise
    except Exception as first_err:
        logger.warning(f"[EIOS/SDO CONN WARN] Direct connection with verify={verify_ssl_setting} failed ({first_err}). Retrying with verify=False...")
        try:
            # Second attempt with verify=False (supports internal KSU network & custom CA)
            resp = sync_requests.get(token_url, params=token_params, verify=False, timeout=8.0)
            token_data = process_token_response(resp)
            verify_ssl_setting = False
        except HTTPException:
            raise
        except Exception as retry_err:
            logger.error(f"[EIOS/SDO CONN FAILED] Both SSL verified and insecure attempts failed: {retry_err}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Сервер ЭИОС КГУ (eios.kosgos.ru / sdo.kosgos.ru) недоступен из сети виртуальной машины: {str(retry_err)}"
            )

    if not token_data or "error" in token_data or "token" not in token_data:
        err_msg = token_data.get("error", "Неверный логин или пароль ЭИОС / СДО КГУ") if token_data else "Неверный ответ сервера ЭИОС КГУ"
        logger.warning(f"[EIOS/SDO AUTH REJECTED] User: {username}, Error: {err_msg}")
        raise HTTPException(status_code=400, detail=err_msg)

    wstoken = token_data["token"]
    logger.info(f"[SDO AUTH SUCCESS] Token obtained for {username}")

    rest_url = "https://sdo.kosgos.ru/webservice/rest/server.php"
    info_params = {
        "wstoken": wstoken,
        "moodlewsrestformat": "json",
        "wsfunction": "core_webservice_get_site_info"
    }

    fullname = username
    userid = None
    userpictureurl = ""
    department_name = ""
    courses_list = []

    async with httpx.AsyncClient(verify=verify_ssl_setting, timeout=12.0) as client:
        try:
            info_resp = await client.post(rest_url, data=info_params)
            info_data = info_resp.json()
            fullname = info_data.get("fullname", "").strip() or info_data.get("username", "").strip() or username
            userid = info_data.get("userid")
            userpictureurl = info_data.get("userpictureurl", "")
        except Exception as info_err:
            logger.warning(f"[SDO SITE INFO WARN] Could not fetch site info: {info_err}")

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
            except Exception as user_err:
                logger.warning(f"[SDO USER DETAILS WARN] Could not fetch user details: {user_err}")

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
            except Exception as course_err:
                logger.warning(f"[SDO COURSES WARN] Could not fetch enrolled courses: {course_err}")
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

    logger.info(f"[SDO LOGIN COMPLETE] User {username} ({fullname}) successfully logged in")
    return schemas.TokenResponse(access_token=jwt_token, user=user_resp)

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(security.require_current_user)):
    return current_user
