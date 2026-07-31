from sqlalchemy import Column, String, Date, Enum, Numeric, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id        = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date           = Column(Date, nullable=False)
    type           = Column(Enum("Expenses", "Income", "Savings", name="expense_type_enum"), nullable=False)
    category       = Column(String(100), nullable=False)
    amount         = Column(Numeric(10, 2), nullable=False)
    base_amount    = Column(Numeric(10, 2), nullable=False)
    exchange_rate  = Column(Numeric(10, 6), nullable=False, default=1.0)
    currency       = Column(String(3), nullable=False, default="GHS")
    details        = Column(String(255), nullable=True)
    payment_method = Column(Enum("Cash", "MoMo", "Card", "Bank Transfer", name="payment_method_enum"), nullable=True)
    source         = Column(Enum("excel", "form", "ai_chat", name="source_enum"), nullable=False, default="form")
    notes          = Column(Text, nullable=True)
    is_recurring   = Column(Boolean, nullable=False, default=False)
    recurrence_period = Column(Enum("daily", "weekly", "monthly", "yearly", "custom", name="recurrence_enum"), nullable=True)
    recurrence_days = Column(String(50), nullable=True)
    recurrence_end_date = Column(Date, nullable=True)
    sync_hash      = Column(String(64), unique=True, nullable=True)
    created_at     = Column(DateTime, server_default=func.now())
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship back to user
    user = relationship("User", back_populates="expenses")