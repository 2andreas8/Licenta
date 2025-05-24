from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from auth import models, security, schemas, password_utils
from auth.security import get_current_user

from sqlalchemy.orm import Session
from database.db import SessionLocal
from auth.models import User as DBUser
from auth.schemas import UserCreate, ChangePasswordRequest
from auth.password_utils import  hash_password

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username. Please check your credentials and try again.",
        )

    if not password_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials and try again.",
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "message": f"Welcome back, {user.username}!"}

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout():
    return {"message": "Logged out. Token should be removed on client side."}

@router.post("/register", response_model=schemas.User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    print("Register endpoint called with username:", user.username)

    # Verifica daca userul exista deja
    existing_user = db.query(DBUser).filter(DBUser.username == user.username).first()
    if existing_user:
        print("Username already exists:", user.username)
        raise HTTPException(
            status_code=400, 
            detail="Username already exists."
        )

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
    
@router.post("/change_password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    if not password_utils.verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect.")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
