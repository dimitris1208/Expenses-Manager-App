from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DB_USER = os.getenv("PA_SSH_USER")
DB_PASS = os.getenv("PA_DB_PASS")
DB_HOST = os.getenv("PA_DB_HOST")
DB_NAME = os.getenv("PA_DB_NAME")


# Let's try the safest "Special Character" fix:
# We URL-encode the password to ensure symbols don't break the connection.
import urllib.parse
safe_password = urllib.parse.quote_plus(DB_PASS)

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{safe_password}@{DB_HOST}/{DB_NAME}"

# Create the Engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=280
)

# Create the Session
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    import models
    Base.metadata.create_all(bind=engine)