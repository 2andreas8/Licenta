from pydantic import BaseModel
from typing import Optional

class LoginData(BaseModel):
    email: str
    password: str

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

    model_config = {
        "from_attributes": True
    } # setare pt a permite fastapi sa faca trecerea din sqlalchemy user -> pydantic user -> json

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    message: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str