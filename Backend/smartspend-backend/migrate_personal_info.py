from app.database import engine
from sqlalchemy import text, inspect


COLUMNS_TO_ADD = [
    ("country", "VARCHAR(100)"),
    ("phone_number", "VARCHAR(20)"),
    ("profession", "VARCHAR(100)"),
    ("auth_provider", "VARCHAR(20) NOT NULL DEFAULT 'local'"),
]


def _column_exists(conn, table_name: str, column_name: str) -> bool:
    """Works on both PostgreSQL and MySQL via information_schema."""
    result = conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = :table_name
              AND column_name = :column_name
            LIMIT 1
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).fetchone()
    return result is not None


def migrate():
    """
    Idempotent column migrations for the users table.
    Each column is checked/added in its own transaction so a
    Postgres 'already exists' failure cannot abort later ALTERs.
    """
    with engine.connect() as conn:
        # Prefer SQLAlchemy inspector when available (handles dialect casing)
        try:
            existing = {col["name"] for col in inspect(engine).get_columns("users")}
        except Exception:
            existing = None

        for col_name, col_type in COLUMNS_TO_ADD:
            try:
                if existing is not None:
                    already_there = col_name in existing
                else:
                    already_there = _column_exists(conn, "users", col_name)

                if already_there:
                    print(f"Column {col_name} already exists. Skipping.", flush=True)
                    continue

                print(f"Adding column {col_name}...", flush=True)
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Added {col_name}", flush=True)
                if existing is not None:
                    existing.add(col_name)
            except Exception as e:
                conn.rollback()
                print(f"Error ({col_name}): {e}", flush=True)


if __name__ == "__main__":
    migrate()
