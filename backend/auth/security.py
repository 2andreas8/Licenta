import os
from typing import Optional

from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta

import jwt
from jwt import PyJWTError, ExpiredSignatureError, InvalidTokenError
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth.models import User
from documents.models import Document

# from database.fake_db import get_user

from auth.password_utils import hash_password, verify_password
from database.db import SessionLocal
from sqlalchemy.orm import Session

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_TOKEN_SECRET = os.getenv("REFRESH_TOKEN_SECRET", SECRET_KEY + "_refresh")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))

if not SECRET_KEY or not ALGORITHM:
    raise ValueError("SECRET_KEY and ALGORITHM must be set in the environment variables.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Token has no subject")

    # Use the real database to find the user
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def create_access_token(data: dict[str, str], expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except (ExpiredSignatureError, InvalidTokenError, PyJWTError) as e:
        logging.error(f"Token decoding error: {e}")
        return None
    
def create_refresh_token(data: dict[str, str]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_TOKEN_SECRET, algorithm=ALGORITHM)

def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, REFRESH_TOKEN_SECRET, algorithms=[ALGORITHM])
    except (ExpiredSignatureError, InvalidTokenError, PyJWTError) as e:
        logging.error(f"Refresh token decoding error: {e}")
        return None
