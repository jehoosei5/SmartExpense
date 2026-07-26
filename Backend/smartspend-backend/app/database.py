from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
from urllib.parse import quote_plus

# quote_plus encodes special characters like @ in the password
password = quote_plus(settings.DB_PASSWORD)

# Build the MySQL connection URL
DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{password}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    f"?charset=utf8mb4"
)

# Engine = the actual connection to MySQL
engine = create_engine(
    DATABASE_URL,
    echo=True if settings.APP_ENV == "development" else False
)

# SessionLocal = a factory that creates database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = parent class for all SQLAlchemy models
Base = declarative_base()

# Dependency — used in routers to get a DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()