# fisier temporar

from database.db import Base, engine
from auth.models import User

Base.metadata.create_all(engine)

print("Tabelul a fost creat cu succes!")