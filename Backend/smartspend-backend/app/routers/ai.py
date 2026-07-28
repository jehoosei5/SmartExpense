from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.utils.rate_limit import limiter
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.ai import (
    UnifiedChatRequest,
    UnifiedChatResponse,
    ParsedExpense
)
from app.schemas.expense import ExpenseCreate
from app.services.ai_service import handle_chat_message
from app.services.expense_service import create_expense

router = APIRouter(prefix="/ai", tags=["AI Chat"])


@router.post("/chat", response_model=UnifiedChatResponse)
@limiter.limit("10/minute")
def chat(
    request: Request,
    data: UnifiedChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result, error = handle_chat_message(
        db=db,
        message=data.message,
        user_id=current_user.id,
        session_id=data.session_id
    )

    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    return UnifiedChatResponse(**result)


@router.post("/chat/confirm")
@limiter.limit("10/minute")
def confirm_parsed_expense(
    request: Request,
    parsed: ParsedExpense,
    session_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves an AI-parsed expense directly without re-querying the LLM.
    """
    # Save to database as ai_chat source
    expense_data = ExpenseCreate(
        date=parsed.date,
        type=parsed.type,
        category=parsed.category,
        amount=parsed.amount,
        currency=parsed.currency,
        details=parsed.details if parsed.details else None,
        payment_method=parsed.payment_method if parsed.payment_method else "Cash",
        notes=parsed.notes if parsed.notes else None,
        source="ai_chat"
    )

    expense, exp_error = create_expense(db, expense_data, current_user.id)

    if exp_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exp_error
        )

    return {
        "message": "Expense saved successfully!",
        "expense_id": expense.id,
        "session_id": session_id
    }


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.chat import AIChatSession
    sessions = db.query(AIChatSession).filter(
        AIChatSession.user_id == current_user.id
    ).order_by(AIChatSession.last_active_at.desc()).all()

    return [
        {
            "id":             s.id,
            "started_at":     s.started_at,
            "last_active_at": s.last_active_at
        }
        for s in sessions
    ]