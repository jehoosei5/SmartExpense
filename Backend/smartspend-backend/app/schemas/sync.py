from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SyncResponse(BaseModel):
    status:        str
    total_rows:    int
    inserted_rows: int
    skipped_rows:  int
    failed_rows:   int
    errors:        Optional[list] = None

class SyncLogResponse(BaseModel):
    id:            int
    synced_at:     datetime
    total_rows:    int
    inserted_rows: int
    skipped_rows:  int
    failed_rows:   int
    status:        str

    class Config:
        from_attributes = True