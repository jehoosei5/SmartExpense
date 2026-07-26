from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.sync_log import SyncLog
from app.utils.hashing import generate_sync_hash
import pandas as pd
import io

# These are the exact column names we expect from the Excel CSV export
REQUIRED_COLUMNS = {"Date", "Type ", "Category", "Amount"}

# Map Excel column names to our database field names
COLUMN_MAP = {
    "Date":           "date",
    "Type ":          "type",
    "Category":       "category",
    "Amount":         "amount",
    "Details":        "details",
    "Payment Method": "payment_method",
    "Notes":          "notes"
}

VALID_TYPES      = {"Expenses", "Income", "Savings"}
VALID_PAYMENTS   = {"Cash", "MoMo", "Card", "Bank Transfer", None}


def process_sync(db: Session, file_bytes: bytes, user_id: str):
    inserted  = 0
    skipped   = 0
    failed    = 0
    errors    = []

    # ── Step 1: Read the CSV file ─────────────────────────────────────────────
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), skiprows=10)
    except Exception as e:
        return {
            "status":        "failed",
            "total_rows":    0,
            "inserted_rows": 0,
            "skipped_rows":  0,
            "failed_rows":   0,
            "errors":        [f"Could not read CSV file: {str(e)}"]
        }

    # ── Step 2: Check required columns exist ──────────────────────────────────
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return {
            "status":        "failed",
            "total_rows":    0,
            "inserted_rows": 0,
            "skipped_rows":  0,
            "failed_rows":   0,
            "errors":        [f"Missing columns: {missing}"]
        }

    # ── Step 3: Clean the data ────────────────────────────────────────────────
    # Only keep rows that have at least a date and amount
    df = df.dropna(subset=["Date", "Amount"])
    total = len(df)

    # ── Step 4: Process each row ──────────────────────────────────────────────
    # Use enumerate for a stable 0-based row_index so that two rows with
    # identical content (e.g. same day, same amount, same category) still
    # produce different hashes and are both inserted correctly.
    for row_index, (_, row) in enumerate(df.iterrows()):
        row_num = row_index + 2  # +2 because Excel rows start at 1 and row 1 is header
        try:
            # Extract and clean values
            date     = pd.to_datetime(row["Date"]).date()
            type_val = str(row["Type "]).strip()
            category = str(row["Category"]).strip()
            amount   = float(row["Amount"])
            details  = str(row.get("Details", "")).strip() or None
            payment  = str(row.get("Payment Method", "")).strip() or None
            notes    = str(row.get("Notes", "")).strip() or None

            # Validate type
            if type_val not in VALID_TYPES:
                errors.append(f"Row {row_num}: Invalid type '{type_val}'")
                failed += 1
                continue

            # Validate payment method
            if payment and payment not in VALID_PAYMENTS:
                payment = None  # just clear it instead of failing the row

            # Generate sync hash — row_index is included so two rows with
            # identical content still get unique hashes
            sync_hash = generate_sync_hash(
                user_id=user_id,
                row_index=str(row_index),
                date=str(date),
                type=type_val,
                category=category,
                amount=str(amount),
                details=details or ""
            )

            # Check for duplicate (re-upload of the same file)
            existing = db.query(Expense).filter(
                Expense.sync_hash == sync_hash
            ).first()

            if existing:
                skipped += 1
                continue

            # Create expense record
            expense = Expense(
                user_id=user_id,
                date=date,
                type=type_val,
                category=category,
                amount=amount,
                currency="GHS",
                details=details,
                payment_method=payment,
                source="excel",
                notes=notes,
                sync_hash=sync_hash
            )
            db.add(expense)
            inserted += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            failed += 1
            continue

    # ── Step 5: Commit all valid rows at once ─────────────────────────────────
    db.commit()

    # ── Step 6: Determine overall status ─────────────────────────────────────
    if failed == 0:
        status = "success"
    elif inserted > 0:
        status = "partial"
    else:
        status = "failed"

    # ── Step 7: Save sync log ─────────────────────────────────────────────────
    import json
    log = SyncLog(
        user_id=user_id,
        total_rows=total,
        inserted_rows=inserted,
        skipped_rows=skipped,
        failed_rows=failed,
        status=status,
        error_details=json.dumps(errors) if errors else None
    )
    db.add(log)
    db.commit()

    return {
        "status":        status,
        "total_rows":    total,
        "inserted_rows": inserted,
        "skipped_rows":  skipped,
        "failed_rows":   failed,
        "errors":        errors if errors else None
    }


def get_sync_logs(db: Session, user_id: str):
    return db.query(SyncLog).filter(
        SyncLog.user_id == user_id
    ).order_by(SyncLog.synced_at.desc()).all()