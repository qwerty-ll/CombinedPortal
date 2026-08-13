import os
import uuid
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Set
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db.database import get_db
import app.models as models

load_dotenv()

raw_secret = os.getenv("SECRET_KEY")
if not raw_secret:
    # SECURITY: Refusing to start without a proper SECRET_KEY.
    # A hardcoded fallback would compromise all JWT tokens.
    raise RuntimeError(
        "CRITICAL SECURITY ERROR: SECRET_KEY environment variable is not set. "
        "Server startup aborted. Please set SECRET_KEY in your .env file."
    )

SECRET_KEY = raw_secret
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"
# Use secure cookies in production (HTTPS). Set COOKIE_SECURE=false only for local dev.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# FIX (B-02): tokenUrl updated to the actual login endpoint used by this app.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/eios-login", auto_error=False)

# FIX (C-03): Multi-worker & DB-backed JWT revocation list.
# Stores revoked JTIs (JWT IDs) both in-memory (L1 cache) and SQLite DB (persistent across workers/restarts).
_revoked_jtis: Set[str] = set()

def revoke_token(jti: str, db: Optional[Session] = None) -> None:
    """Add a JTI to the revocation list (memory + DB)."""
    _revoked_jtis.add(jti)
    if db is not None:
        try:
            from sqlalchemy.exc import IntegrityError
            rev_item = models.RevokedToken(jti=jti)
            db.add(rev_item)
            db.commit()
        except Exception:
            db.rollback()

def is_token_revoked(jti: str, db: Optional[Session] = None) -> bool:
    """Return True if the JTI has been revoked via logout."""
    if jti in _revoked_jtis:
        return True
    if db is not None:
        rev_db = db.query(models.RevokedToken).filter(models.RevokedToken.jti == jti).first()
        if rev_db:
            _revoked_jtis.add(jti)
            return True
    return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    if hashed_password.startswith("$2"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    sha256_hash = hashlib.sha256((plain_password or "").encode("utf-8")).hexdigest()
    return sha256_hash == hashed_password

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password or "")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # FIX (C-03): Add jti (JWT ID) to every token to support revocation on logout.
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    auth_token = token or request.cookies.get("portal_token")
    if not auth_token:
        return None
    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        jti: str = payload.get("jti")
        if username is None:
            return None
        # FIX (C-03): Check JWT revocation list (memory + DB)
        if jti and is_token_revoked(jti, db):
            return None
    except JWTError:
        return None

    user = db.query(models.User).filter(models.User.username == username).first()
    return user

def require_current_user(user: Optional[models.User] = Depends(get_current_user)) -> models.User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_admin(user: models.User = Depends(require_current_user)) -> models.User:
    if user.role not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа",
        )
    return user
