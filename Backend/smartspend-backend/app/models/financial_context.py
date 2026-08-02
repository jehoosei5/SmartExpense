from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class UserFinancialContext(Base):
    __tablename__ = "user_financial_context"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Screen 1
    tracking_focus = Column(String(100), nullable=True)
    
    # Screen 2
    main_income_source = Column(String(100), nullable=True)
    monthly_income_range = Column(String(100), nullable=True)
    payment_methods = Column(JSON, nullable=True) # List of strings e.g., ["Cash", "MoMo"]
    
    # Screen 3
    top_categories = Column(JSON, nullable=True) # List of strings e.g., ["Food", "Transportation"]

    user = relationship("User", back_populates="financial_context")
