from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.sync import SyncResponse, SyncLogResponse
from app.services.sync_service import process_sync, get_sync_logs

router = APIRouter(prefix="/sync", tags=["Excel Sync"])


@router.post("/upload", response_model=SyncResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted. Export your Excel sheet as CSV first."
        )

    # Read file contents
    file_bytes = await file.read()

    # Process the sync
    result = process_sync(db, file_bytes, current_user.id)

    return result


@router.get("/logs", response_model=list[SyncLogResponse])
def sync_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_sync_logs(db, current_user.id)