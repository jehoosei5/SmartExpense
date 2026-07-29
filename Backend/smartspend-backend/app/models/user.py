from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email            = Column(String(255), unique=True, nullable=False)
    password_hash    = Column(String(255), nullable=False)
    display_name     = Column(String(100), nullable=False)
    default_currency = Column(String(3), nullable=False, default="GHS")
    created_at       = Column(DateTime, server_default=func.now())
    updated_at       = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    # When a user is deleted, we want to cascade delete their expenses, refresh tokens, chat sessions, and sync logs
    expenses       = relationship("Expense", back_populates="user", cascade="all, delete") 
    #when a user is deleted, we want to cascade delete their refresh tokens, chat sessions, and sync logs
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete")
    #when a user is deleted, we want to cascade delete their chat sessions and sync logs
    chat_sessions  = relationship("AIChatSession", back_populates="user", cascade="all, delete")
    #when a user is deleted, we want to cascade delete their sync logs
    sync_logs      = relationship("SyncLog", back_populates="user", cascade="all, delete")
    #when a user is deleted, we want to cascade delete their budgets
    budgets        = relationship("Budget", back_populates="user", cascade="all, delete")

    @property
    def is_oauth_user(self) -> bool:
        return len(self.password_hash) > 60