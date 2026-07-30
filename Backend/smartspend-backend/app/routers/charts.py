from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.charts import (
    MonthlySummary,
    CategoryBreakdown,
    TrendPoint,
    DashboardSummary
)
from app.services.charts_service import (
    get_monthly_summary,
    get_category_breakdown,
    get_trend,
    get_dashboard_summary
)

router = APIRouter(prefix="/charts", tags=["Charts & Dashboard"])


@router.get("/monthly", response_model=list[MonthlySummary])
def monthly_summary(
    year:       Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date:   Optional[date] = Query(None),
    db:         Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_monthly_summary(db, current_user.id, year, start_date, end_date)


@router.get("/categories", response_model=list[CategoryBreakdown])
def category_breakdown(
    type:  Optional[str] = Query(None),
    month: Optional[int] = Query(None),
    year:  Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date:   Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_category_breakdown(db, current_user.id, type, month, year, start_date, end_date)


@router.get("/trend", response_model=list[TrendPoint])
def trend(
    months: int = Query(6),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_trend(db, current_user.id, months)


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    start_date: Optional[date] = Query(None),
    end_date:   Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_summary(db, current_user.id, start_date, end_date)