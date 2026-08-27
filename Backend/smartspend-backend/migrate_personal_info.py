from app.database import engine
from sqlalchemy import text, inspect


# (table, column, SQL type)
COLUMNS_TO_ADD = [
    ("users", "country", "VARCHAR(100)"),
    ("users", "phone_number", "VARCHAR(20)"),
    ("users", "profession", "VARCHAR(100)"),
    ("users", "auth_provider", "VARCHAR(20) NOT NULL DEFAULT 'local'"),
    ("otps", "attempts", "INTEGER NOT NULL DEFAULT 0"),
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
    Idempotent column migrations.
    Each column is checked/added in its own transaction so a
    Postgres 'already exists' failure cannot abort later ALTERs.
    """
    with engine.connect() as conn:
        for table_name, col_name, col_type in COLUMNS_TO_ADD:
            try:
                try:
                    existing = {
                        col["name"] for col in inspect(engine).get_columns(table_name)
                    }
                    already_there = col_name in existing
                except Exception:
                    already_there = _column_exists(conn, table_name, col_name)

                if already_there:
                    print(
                        f"Column {table_name}.{col_name} already exists. Skipping.",
                        flush=True,
                    )
                    continue

                print(f"Adding column {table_name}.{col_name}...", flush=True)
                conn.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};")
                )
                conn.commit()
                print(f"Added {table_name}.{col_name}", flush=True)
            except Exception as e:
                conn.rollback()
                print(f"Error ({table_name}.{col_name}): {e}", flush=True)


if __name__ == "__main__":
    migrate()
