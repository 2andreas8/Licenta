from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Creeaza conexiunea cu baza de date folosind SQLAlchemy
engine = create_engine(DATABASE_URL)

# Creeaza sesiunea cu baza de date (nu salveaza automat modificari + nu trimite date automat inainte de query-uri) -> tu alegi cand sa faci .commit() / .flush()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()