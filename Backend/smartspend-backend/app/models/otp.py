from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
import uuid
from app.database import Base
from datetime import datetime

class OTP(Base):
    __tablename__ = "otps"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email      = Column(String(255), nullable=False, index=True)
    code       = Column(String(6), nullable=False)
    purpose    = Column(String(20), nullable=False, default="VERIFICATION")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    def is_valid(self):
        return datetime.utcnow() <= self.expires_at
