from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.utils.rate_limit import limiter
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.ai import (
    ParseRequest,
    ParseResponse,
    QueryRequest,
    QueryResponse
)
from app.schemas.expense import ExpenseCreate
from app.services.ai_service import parse_expense, query_expenses
from app.services.expense_service import create_expense

router = APIRouter(prefix="/ai", tags=["AI Chat"])


@router.post("/parse", response_model=ParseResponse)
@limiter.limit("10/minute")
def parse(
    request: Request,
    data: ParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parsed, summary, session_id, error = parse_expense(
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

    return ParseResponse(parsed=parsed, message=summary)


@router.post("/parse/confirm")
@limiter.limit("10/minute")
def confirm_parsed_expense(
    request: Request,
    data: ParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    After /parse shows the user what was extracted,
    this endpoint saves it to the database.
    The client sends the same message again with confirmed=true
    or sends the parsed fields directly.
    """
    parsed, summary, session_id, error = parse_expense(
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

    # Save to database as ai_chat source
    expense_data = ExpenseCreate(
        date=parsed.date,
        type=parsed.type,
        category=parsed.category,
        amount=parsed.amount,
        currency=parsed.currency,
        details=parsed.details,
        payment_method=parsed.payment_method,
        notes=parsed.notes,
        source="ai_chat"
    )

    expense, exp_error = create_expense(db, expense_data, current_user.id)

    if exp_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exp_error
        )

    return {
        "message": f"Saved! {summary}",
        "expense_id": expense.id,
        "session_id": session_id
    }


@router.post("/query", response_model=QueryResponse)
@limiter.limit("10/minute")
def query(
    request: Request,
    data: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result, session_id, error = query_expenses(
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

    return QueryResponse(
        answer=result["answer"],
        data=result["data"],
        total=result["total"],
        chart_hint=result["chart_hint"]
    )


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