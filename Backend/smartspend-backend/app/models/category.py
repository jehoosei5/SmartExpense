from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name       = Column(String(100), nullable=False)
    type       = Column(Enum("Expenses", "Income", "Savings", name="category_type_enum"), nullable=False)
    is_default = Column(Integer, nullable=False, default=0)
    position   = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    
    __table_args__ = (
        UniqueConstraint("user_id", "name", "type", name="uq_category_user_name_type"),
    )# Relationship back to user is defined in User model with back_populates="categories"