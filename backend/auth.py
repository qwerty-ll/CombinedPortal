import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
import models

import secrets

load_dotenv()

raw_secret = os.getenv("SECRET_KEY")
if not raw_secret:
    print("[SECURITY WARNING] SECRET_KEY not set in environment. Generating dynamic 256-bit secret key for JWT tokens.")
    raw_secret = secrets.token_urlsafe(32)

SECRET_KEY = raw_secret
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    # If bcrypt hash
    if hashed_password.startswith("$2"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    # Legacy SHA256 hash
    sha256_hash = hashlib.sha256((plain_password or "").encode("utf-8")).hexdigest()
    return sha256_hash == hashed_password

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password or "")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
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
