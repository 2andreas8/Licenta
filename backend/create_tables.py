# fisier temporar
from database.db import Base, engine
from auth.models import User
from documents.models import Document

Base.metadata.create_all(engine)

print("Tabelul a fost creat cu succes!")