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
            
            # List of columns to check and add
            columns_to_add = [
                ("is_recurring", "BOOLEAN NOT NULL DEFAULT FALSE"),
                ("recurrence_period", "VARCHAR(50) NULL"),
                ("recurrence_days", "VARCHAR(50) NULL"),
                ("recurrence_end_date", "DATE NULL"),
                ("base_amount", "DECIMAL(10, 2) NULL"),
                ("exchange_rate", "DECIMAL(10, 6) NULL"),
                ("sync_hash", "VARCHAR(64) NULL")
            ]
            
            for col_name, col_type in columns_to_add:
                # Check if column exists
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='expenses' AND column_name='{col_name}'
                """)
                
                result = conn.execute(check_query).fetchone()
                
                if not result:
                    logger.info(f"Adding missing column {col_name} to expenses table...")
                    try:
                        conn.execute(text(f"ALTER TABLE expenses ADD COLUMN {col_name} {col_type};"))
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
            
            logger.info("Migration completed successfully!")

        except Exception as e:
            logger.error(f"Migration failed globally: {e}")

if __name__ == "__main__":
    run_migration()
