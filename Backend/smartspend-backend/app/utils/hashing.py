import hashlib

def generate_sync_hash(
    user_id: str,
    date: str,
    type: str,
    category: str,
    amount: str,
    details: str = "",
    row_index: str = "0"
) -> str:
    """
    Generate a unique fingerprint for an expense record.
    row_index is the 0-based position of the row in the uploaded file,
    which ensures two rows with identical content (same date, category,
    amount, details) still produce different hashes and are both inserted.
    Re-uploading the same file will skip all rows since the hashes match.
    """
    raw = f"{user_id}|{row_index}|{date}|{type}|{category}|{amount}|{details}"
    return hashlib.sha256(raw.encode()).hexdigest()