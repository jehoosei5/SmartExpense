from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
import uuid
from app.database import Base


class UserCategoryPreference(Base):
    """
    Per-user overrides for categories (including shared system defaults).
    - is_hidden: user "deleted" this category from their view only
    - position: user-specific sort order (falls back to Category.position when null)
    """
    __tablename__ = "user_category_preferences"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id     = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    is_hidden   = Column(Boolean, nullable=False, default=False)
    position    = Column(Integer, nullable=True)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "category_id", name="uq_user_category_pref"),
    )
