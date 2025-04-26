from auth.schemas import UserInDB
from auth.password_utils import hash_password

fake_users_db = {
    "andrei": UserInDB(
        username="andrei",
        full_name="Andrei Popescu",
        email="andrei@example.com",
        hashed_password=hash_password("parola123"),
        disabled=False
    )
}

def get_user(username: str):
    user = fake_users_db.get(username)
    return user