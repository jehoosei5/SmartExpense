from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN country VARCHAR(100);"))
            print("Added country")
        except Exception as e:
            print(f"Error (country): {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);"))
            print("Added phone_number")
        except Exception as e:
            print(f"Error (phone_number): {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profession VARCHAR(100);"))
            print("Added profession")
        except Exception as e:
            print(f"Error (profession): {e}")
            
        conn.commit()

if __name__ == "__main__":
    migrate()
