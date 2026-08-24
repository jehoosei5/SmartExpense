import sys
import os
import logging
from sqlalchemy import text

# Ensure we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """
    Adds missing columns to the expenses table for PostgreSQL (Render).
    """
    with engine.connect() as conn:
        try:
            logger.info("Starting Postgres migration...")
            
            columns_to_add = [
                ("expenses", "is_recurring", "BOOLEAN NOT NULL DEFAULT FALSE"),
                ("expenses", "recurrence_period", "VARCHAR(50) NULL"),
                ("expenses", "recurrence_days", "VARCHAR(50) NULL"),
                ("expenses", "recurrence_end_date", "DATE NULL"),
                ("expenses", "base_amount", "DECIMAL(10, 2) NULL"),
                ("expenses", "exchange_rate", "DECIMAL(10, 6) NULL"),
                ("expenses", "sync_hash", "VARCHAR(64) NULL"),
                ("users", "report_frequency", "VARCHAR(20) NOT NULL DEFAULT 'NONE'"),
                ("users", "last_report_sent_at", "TIMESTAMP NULL")
            ]
            
            for table_name, col_name, col_type in columns_to_add:
                # Check if column exists
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='{table_name}' AND column_name='{col_name}'
                """)
                
                result = conn.execute(check_query).fetchone()
                
                if not result:
                    logger.info(f"Adding missing column {col_name} to {table_name} table...")
                    try:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};"))
                        conn.commit()  # Commit immediately to apply schema change
                        logger.info(f"Added column: {col_name}")
                    except Exception as e:
                        conn.rollback()
                        logger.error(f"Failed to add {col_name}: {e}")
                else:
                    logger.info(f"Column {col_name} already exists. Skipping.")
            
            # Backfill data for base_amount and exchange_rate
            logger.info("Backfilling base_amount and exchange_rate...")
            try:
                conn.execute(text("UPDATE expenses SET base_amount = amount, exchange_rate = 1.0 WHERE base_amount IS NULL;"))
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to backfill data: {e}")

            # Per-user category hide/reorder overrides
            logger.info("Ensuring user_category_preferences table exists...")
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_category_preferences (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
                        position INTEGER NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        CONSTRAINT uq_user_category_pref UNIQUE (user_id, category_id)
                    );
                """))
                conn.commit()
                logger.info("user_category_preferences table ready.")
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to create user_category_preferences: {e}")
            
            logger.info("Migration completed successfully!")

        except Exception as e:
            logger.error(f"Migration failed globally: {e}")

if __name__ == "__main__":
    run_migration()
