import os
import secrets
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

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

# Protected admin usernames that can never be role-changed by other admins.
# FIX (M-04): Removed hardcoded developer username — all protected names from env or system-level only.
_PROTECTED_ADMIN_USERNAMES = frozenset({os.getenv("ADMIN_USERNAME", "ivitsh_admin").lower(), "admin"})


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set the JWT auth cookie with appropriate security flags."""
    response.set_cookie(
        key="portal_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=security.COOKIE_SECURE,
        max_age=86400 * 7
    )


@router.post("/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    username_clean = user_in.username.strip()
    if not username_clean or len(username_clean) < 3:
        raise HTTPException(status_code=400, detail="Логин должен содержать минимум 3 символа")
    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть длиной не менее 6 символов")

    hashed_pw = security.get_password_hash(user_in.password)
    new_user = models.User(
        username=username_clean,
        full_name=user_in.full_name,
        email=user_in.email,
        group_number=user_in.group_number,
        hashed_password=hashed_pw,
        role="student"
    )
    # FIX (C-01): Wrap INSERT in try/except IntegrityError to handle concurrent
    # registration with the same username (TOCTOU). Previously returned HTTP 500.
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    token = security.create_access_token(data={"sub": new_user.username})
    _set_auth_cookie(response, token)
    logger.info(f"[REGISTER SUCCESS] New user registered: {new_user.username}")
    return schemas.TokenResponse(access_token=token, user=new_user)


@router.post("/admin-login", response_model=schemas.TokenResponse)
def admin_login(user_in: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    admin_user_env = os.getenv("ADMIN_USERNAME", "ivitsh_admin")
    admin_pass_env = os.getenv("ADMIN_PASSWORD")

    username_clean = user_in.username.strip().lower()
    # SECURITY: is_env_admin requires ALL three conditions:
    # 1) ADMIN_PASSWORD is set in env
    # 2) username exactly matches ADMIN_USERNAME from env
    # 3) password matches ADMIN_PASSWORD exactly (constant-time not needed since this is server env)
    is_env_admin = (
        bool(admin_pass_env)
        and username_clean == admin_user_env.lower()
        and user_in.password == admin_pass_env
    )

    db_user = db.query(models.User).filter(models.User.username == user_in.username.strip()).first()

    if not is_env_admin:
        # Regular DB admin/moderator login
        if not db_user:
            logger.warning(f"[ADMIN LOGIN FAILED] User not found: {user_in.username}")
            raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")
        if db_user.role not in ("admin", "moderator") or not security.verify_password(user_in.password, db_user.hashed_password):
            logger.warning(f"[ADMIN LOGIN FAILED] Invalid credentials for user: {user_in.username}")
            raise HTTPException(status_code=400, detail="Неверный логин или пароль Администратора ИВИТШ")
    else:
        # Env-admin path: credentials verified against environment config.
        # FIX (A-02 regression): If the DB user exists but has a non-admin role,
        # we explicitly set role=admin. This is safe because all 3 env conditions
        # are already verified above — only the configured env-admin triggers this.
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
        elif db_user.role != "admin":
            # Env-admin user exists with wrong role (e.g., was registered as student via EIOS)
            # Env credentials are the authoritative proof → upgrade to admin
            db_user.role = "admin"
            db.commit()
            logger.info(f"[ADMIN LOGIN] Upgraded existing user {db_user.username} to admin via env credentials")

    token = security.create_access_token(data={"sub": db_user.username})
    _set_auth_cookie(response, token)
    logger.info(f"[ADMIN LOGIN SUCCESS] Admin logged in: {db_user.username}")
    return schemas.TokenResponse(access_token=token, user=db_user)


@router.post("/eios-login", response_model=schemas.TokenResponse)
@router.post("/sdo-login", response_model=schemas.TokenResponse)
async def eios_login(sdo_req: schemas.EiosLoginRequest, response: Response, db: Session = Depends(get_db)):
    username = sdo_req.username.strip()
    password = sdo_req.password.strip()

    logger.info(f"[EIOS LOGIN ATTEMPT] Initiating EIOS authentication for user: {username}")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Логин и пароль обязательны для входа через ЭИОС КГУ")

    token_url = "https://sdo.kosgos.ru/login/token.php"
    token_params = {
        "username": username,
        "password": password,
        "service": "moodle_mobile_app"
    }

    rest_url = "https://sdo.kosgos.ru/webservice/rest/server.php"

    fullname = username
    userid = None
    userpictureurl = ""
    department_name = ""
    courses_list = []
    detected_group = sdo_req.group_number.strip() if sdo_req.group_number else ""

    def process_token_response(resp):
        if resp.status_code == 451 or "отключите vpn" in resp.text.lower() or "правовыми ограничениями" in resp.text.lower():
            logger.warning("[EIOS/SDO VPN BLOCK] eios.kosgos.ru / sdo.kosgos.ru returned 451 VPN Block")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Сервер ЭИОС КГУ заблокировал подключение из-за включённого VPN. Пожалуйста, отключите VPN на компьютере или в браузере и повторите попытку."
            )
        try:
            return resp.json()
        except Exception:
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

    # FIX (C-02): All external HTTP calls use async httpx.AsyncClient.
    # Previously, the first token fetch used sync requests.get() inside an async def,
    # which blocked the entire asyncio event loop for up to 12s per concurrent EIOS login.
    async with httpx.AsyncClient(verify=security.VERIFY_SSL, timeout=12.0) as client:
        # Step 1: Fetch EIOS token (async — was blocking)
        try:
            resp = await client.get(token_url, params=token_params)
            token_data = process_token_response(resp)
        except HTTPException:
            raise
        except Exception as conn_err:
            logger.error(f"[EIOS/SDO CONN FAILED] Async connection error: {conn_err}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Сервер ЭИОС КГУ (сервер sdo.kosgos.ru) недоступен из сети виртуальной машины: {str(conn_err)}"
            )

        if not token_data or "error" in token_data or "token" not in token_data:
            err_msg = token_data.get("error", "Неверный логин или пароль ЭИОС / СДО КГУ") if token_data else "Неверный ответ сервера ЭИОС КГУ"
            logger.warning(f"[EIOS/SDO AUTH REJECTED] User: {username}, Error: {err_msg}")
            raise HTTPException(status_code=400, detail=err_msg)

        wstoken = token_data["token"]
        logger.info(f"[SDO AUTH SUCCESS] Token obtained for {username}")

        # Step 2: Get site info
        try:
            info_resp = await client.post(rest_url, data={
                "wstoken": wstoken,
                "moodlewsrestformat": "json",
                "wsfunction": "core_webservice_get_site_info"
            })
            info_data = info_resp.json()
            fullname = info_data.get("fullname", "").strip() or info_data.get("username", "").strip() or username
            userid = info_data.get("userid")
            userpictureurl = info_data.get("userpictureurl", "")
        except Exception as info_err:
            logger.warning(f"[SDO SITE INFO WARN] Could not fetch site info: {info_err}")

        # Step 3: Get user details (full name, photo, department/group)
        if userid:
            try:
                u_resp = await client.post(rest_url, data={
                    "wstoken": wstoken,
                    "moodlewsrestformat": "json",
                    "wsfunction": "core_user_get_users_by_field",
                    "field": "id",
                    "values[0]": userid
                })
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

    if not detected_group:
        detected_group = department_name or "КГУ ИВИТШ"

    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        # SECURITY: Store a random local password, NOT the real EIOS password.
        local_random_password = secrets.token_hex(32)
        hashed_pw = security.get_password_hash(local_random_password)
        try:
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
        except Exception:
            # A-03 TOCTOU: Another concurrent request already created the user.
            db.rollback()
            db_user = db.query(models.User).filter(models.User.username == username).first()
            if not db_user:
                raise HTTPException(status_code=500, detail="Ошибка создания пользователя. Попробуйте ещё раз.")
    else:
        if fullname and db_user.full_name != fullname:
            db_user.full_name = fullname
        if detected_group and db_user.group_number != detected_group:
            db_user.group_number = detected_group
        db.commit()

    jwt_token = security.create_access_token(data={"sub": db_user.username})
    _set_auth_cookie(response, jwt_token)

    user_resp = schemas.UserResponse(
        id=db_user.id,
        username=db_user.username,
        full_name=db_user.full_name,
        role=db_user.role,
        group_number=db_user.group_number,
        email=db_user.email,
        userpictureurl=userpictureurl,
        courses=courses_list,
        created_at=db_user.created_at
    )

    logger.info(f"[SDO LOGIN COMPLETE] User {username} ({fullname}) successfully logged in")
    return schemas.TokenResponse(access_token=jwt_token, user=user_resp)


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(security.require_current_user)):
    return current_user


@router.post("/logout")
def logout(response: Response, request: Request, token: str = Depends(security.oauth2_scheme), db: Session = Depends(get_db)):
    # FIX (C-03): Revoke the JWT jti in memory + DB so it becomes immediately invalid server-side,
    # across all Uvicorn worker processes and server restarts.
    auth_token = token or request.cookies.get("portal_token")
    if auth_token:
        try:
            from jose import jwt as jose_jwt
            payload = jose_jwt.decode(auth_token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
            jti = payload.get("jti")
            if jti:
                security.revoke_token(jti, db)
                logger.info(f"[LOGOUT] Revoked JWT jti={jti[:8]}...")
        except Exception:
            pass  # Expired or invalid token — nothing to revoke
    response.delete_cookie("portal_token")
    return {"message": "Успешный выход из системы"}
