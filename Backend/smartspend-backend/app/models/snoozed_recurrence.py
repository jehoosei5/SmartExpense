from sqlalchemy import Column, String, Date, Boolean, ForeignKey
from app.database import Base
import uuid

class SnoozedRecurrence(Base):
    __tablename__ = 'snoozed_recurrences'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sync_hash = Column(String(64), unique=True, nullable=False)
    remind_date = Column(Date, nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
