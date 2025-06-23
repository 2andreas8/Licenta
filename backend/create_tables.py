# fisier temporar
from database.db import Base, engine
from auth.models import User
from documents.models import Document, DocumentSummary
from conversations.models import Conversation, Message

Base.metadata.create_all(engine)

print("Tabelul a fost creat cu succes!")