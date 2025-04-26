from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from auth import models, security, schemas
from auth.security import get_current_user
from database.fake_db import get_user

from sqlalchemy.orm import Session
from database.db import SessionLocal
from auth.models import User as DBUser
from auth.schemas import UserCreate
from auth.password_utils import  hash_password

router = APIRouter(prefix="/auth")

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout():
    return {"message": "Logged out. Token should be removed on client side."}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    print("Register endpoint called with username:", user.username)

    # Verifica daca userul exista deja
    existing_user = db.query(DBUser).filter(DBUser.username == user.username).first()
    if existing_user:
        print("Username already exists:", user.username)
        raise HTTPException(status_code=400, detail="Username already registered")

    # Creeaza user nou
    new_user = DBUser(
        username = user.username,
        email = user.email,
        full_name = user.full_name,
        hashed_password=hash_password(user.password),
        disabled = False
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print("User successfully registered:", user.username)
        return new_user
    except Exception as e:
        db.rollback()
        print("Error registering user:", str(e))
        raise HTTPException(status_code=500, detail="Error creating user")
