import logging

from app.database import engine, Base, SessionLocal
from app import models  # noqa: F401 — register ORM models with Base
from app.models.category import Category
from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    ("Food", "Expenses"),
    ("Transportation", "Expenses"),
    ("Utilities", "Expenses"),
    ("Clothing", "Expenses"),
    ("Body Care & Medicine", "Expenses"),
    ("Entertainment", "Expenses"),
    ("Media", "Expenses"),
    ("Education", "Expenses"),
    ("Other", "Expenses"),
    ("Employment (NSS)", "Income"),
    ("Side Hustle", "Income"),
    ("Dividend", "Income"),
    ("Freelance", "Income"),
    ("Mini Business", "Income"),
    ("Other", "Income"),
    ("Emergency Fund", "Savings"),
    ("Future Account", "Savings"),
    ("Investment", "Savings"),
    ("Other", "Savings"),
]


def init_database() -> None:
    """
    Run once when the app starts (not at import time).
    - Dev: create missing tables via SQLAlchemy metadata
    - All envs: apply lightweight column migrations + seed defaults
    """
    logger.info("Initializing database...")

    if settings.APP_ENV.lower() != "production":
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured (development).")
    else:
        logger.info("Skipping create_all in production — use /api/migrate or deploy scripts.")

    try:
        from migrate_personal_info import migrate
        migrate()
        logger.info("Column migrations complete.")
    except Exception as e:
        logger.error("Column migration error: %s", e)

    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            for name, ctype in DEFAULT_CATEGORIES:
                db.add(Category(name=name, type=ctype, is_default=1, user_id=None))
            db.commit()
            logger.info("Default categories seeded.")
        else:
            logger.info("Categories already present — skipping seed.")
    finally:
        db.close()

    logger.info("Database initialization complete.")
