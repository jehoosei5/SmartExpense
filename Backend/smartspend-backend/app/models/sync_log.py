from sqlalchemy import Column, Integer, String, Enum, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    synced_at     = Column(DateTime, server_default=func.now())
    total_rows    = Column(Integer, default=0)
    inserted_rows = Column(Integer, default=0)
    skipped_rows  = Column(Integer, default=0)
    failed_rows   = Column(Integer, default=0)
    status        = Column(Enum("success", "partial", "failed"), default="success")
    error_details = Column(Text, nullable=True)

    user          = relationship("User", back_populates="sync_logs")