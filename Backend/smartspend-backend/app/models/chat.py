from sqlalchemy import Column, Integer, String, Enum, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"

    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id        = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at     = Column(DateTime, server_default=func.now())
    last_active_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user           = relationship("User", back_populates="chat_sessions")
    messages       = relationship("AIChatMessage", back_populates="session", cascade="all, delete")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    session_id   = Column(String(36), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role         = Column(Enum("user", "assistant"), nullable=False)
    content      = Column(Text, nullable=False)
    expense_id   = Column(String(36), ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True)
    chart_type   = Column(String(50), nullable=True)
    chart_params = Column(JSON, nullable=True)
    created_at   = Column(DateTime, server_default=func.now())

    session      = relationship("AIChatSession", back_populates="messages")