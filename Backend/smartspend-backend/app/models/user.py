from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email            = Column(String(255), unique=True, nullable=False)
    password_hash    = Column(String(255), nullable=False)
    is_verified      = Column(Boolean, nullable=False, default=False)
    is_onboarded     = Column(Boolean, nullable=False, default=False)
    display_name     = Column(String(100), nullable=False)
    default_currency = Column(String(3), nullable=False, default="GHS")
    report_frequency = Column(String(20), nullable=False, default="NONE") # NONE, WEEKLY, MONTHLY
    last_report_sent_at = Column(DateTime, nullable=True)
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
    #when a user is deleted, we want to cascade delete their alerts
    alerts         = relationship("Alert", back_populates="user", cascade="all, delete")
    #when a user is deleted, we want to cascade delete their financial context
    financial_context = relationship("UserFinancialContext", back_populates="user", uselist=False, cascade="all, delete")

    @property
    def is_oauth_user(self) -> bool:
        return len(self.password_hash) > 60