from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # SQLite uses a different syntax sometimes, but this works for both SQLite and MySQL if simple
            conn.execute(text("ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;"))
            conn.commit()
            print("Successfully added is_onboarded.")
        except Exception as e:
            print(f"Error (may already exist): {e}")

if __name__ == "__main__":
    migrate()
