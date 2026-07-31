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
            
            # Check if recurrence_period exists
            # We use a query against information_schema to be safe across dialects
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='expenses' AND column_name='recurrence_period'
            """)
            
            result = conn.execute(check_query).fetchone()
            
            if not result:
                logger.info("Adding missing columns to expenses table...")
                
                # Using separate ADD COLUMN statements for broader compatibility
                columns = [
                    "recurrence_period VARCHAR(50) NULL",
                    "recurrence_days VARCHAR(50) NULL",
                    "recurrence_end_date DATE NULL",
                    "base_amount DECIMAL(10, 2) NULL",
                    "exchange_rate DECIMAL(10, 6) NULL"
                ]
                
                for col in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE expenses ADD COLUMN {col};"))
                        logger.info(f"Added column: {col}")
                    except Exception as e:
                        logger.warning(f"Could not add {col}. It might already exist. Error: {e}")
                
                # Backfill data for base_amount and exchange_rate
                logger.info("Backfilling base_amount and exchange_rate...")
                conn.execute(text("UPDATE expenses SET base_amount = amount, exchange_rate = 1.0 WHERE base_amount IS NULL;"))
                
                conn.commit()
                logger.info("Migration completed successfully!")
            else:
                logger.info("Columns already exist. Nothing to do.")

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    run_migration()
