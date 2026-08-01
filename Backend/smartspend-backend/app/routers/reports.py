from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_, or_
from datetime import datetime, timedelta
import calendar
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.utils.email import send_email
from app.config import settings
import logging

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)

def generate_report_html(user: User, expenses: list, period_name: str, start_date: datetime, end_date: datetime) -> str:
    """Generates a beautiful HTML email for the spending report."""
    
    total_spent = sum(e.amount for e in expenses if e.type == "Expenses")
    total_income = sum(e.amount for e in expenses if e.type == "Income")
    net_balance = total_income - total_spent
    currency = user.default_currency
    
    # Calculate top categories
    category_totals = {}
    for e in expenses:
        if e.type == "Expenses":
            category_totals[e.category] = category_totals.get(e.category, 0) + e.amount
            
    top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    
    categories_html = ""
    for cat, amount in top_categories:
        categories_html += f"""
        <div style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #e2e8f0;">
                <tr>
                    <td align="left" style="font-weight: 500;">{cat}</td>
                    <td align="right" style="font-weight: bold; color: #ffffff;">{currency} {amount:,.2f}</td>
                </tr>
            </table>
        </div>
        """
        
    if not categories_html:
        categories_html = "<p style='color: #94a3b8; font-size: 14px; font-style: italic;'>No expenses recorded in this period.</p>"

    html = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #05050f; margin: 0; padding: 40px 20px; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a1a; padding: 0; border-radius: 16px; border: 1px solid #1e1e38; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5, #c026d3); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">SMARTSPEND</h1>
                <h2 style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Your {period_name} Report</h2>
                <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}</p>
            </div>
            
            <div style="padding: 30px;">
                <!-- Summary Cards -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                    <tr>
                        <td width="48%" align="center" style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 20px; border-radius: 12px;">
                            <p style="margin: 0 0 5px 0; color: #10b981; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Income</p>
                            <h3 style="margin: 0; color: #ffffff; font-size: 20px;">{currency} {total_income:,.2f}</h3>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" align="center" style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); padding: 20px; border-radius: 12px;">
                            <p style="margin: 0 0 5px 0; color: #f43f5e; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Expenses</p>
                            <h3 style="margin: 0; color: #ffffff; font-size: 20px;">{currency} {total_spent:,.2f}</h3>
                        </td>
                    </tr>
                </table>
                
                <!-- Net Balance -->
                <div style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
                    <p style="margin: 0 0 5px 0; color: #818cf8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Net Balance</p>
                    <h2 style="margin: 0; color: #ffffff; font-size: 28px;">{currency} {net_balance:,.2f}</h2>
                </div>

                <!-- Top Categories -->
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 20px; border-bottom: 1px solid #1e1e38; padding-bottom: 10px;">Top Spending Categories</h3>
                {categories_html}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #05050f; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e1e38;">
                <p style="margin: 0 0 5px 0;">You are receiving this because your report frequency is set to {user.report_frequency}.</p>
                <p style="margin: 0;">Update your preferences in SmartSpend Settings.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

@router.post("/trigger")
def trigger_reports(x_cron_secret: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Triggers sending of email reports.
    Should be called daily by an external cron job.
    """
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized cron trigger")
        
    today = datetime.now()
    is_sunday = today.weekday() == 6
    is_first_of_month = today.day == 1
    
    logger.info("Starting report generation process...")
    sent_count = 0
    
    users = db.query(User).filter(User.report_frequency.in_(["WEEKLY", "MONTHLY"])).all()
    
    for user in users:
        # Check if already sent today to prevent duplicates
        if user.last_report_sent_at and user.last_report_sent_at.date() == today.date():
            continue
            
        should_send = False
        start_date = None
        period_name = ""
        
        if user.report_frequency == "WEEKLY" and is_sunday:
            should_send = True
            start_date = today - timedelta(days=7)
            period_name = "Weekly"
        elif user.report_frequency == "MONTHLY" and is_first_of_month:
            should_send = True
            # Calculate 1st of previous month
            last_month = today.month - 1 if today.month > 1 else 12
            year = today.year if today.month > 1 else today.year - 1
            start_date = datetime(year, last_month, 1)
            period_name = "Monthly"
            
        if should_send:
            # Fetch expenses
            expenses = db.query(Expense).filter(
                Expense.user_id == user.id,
                Expense.date >= start_date.date(),
                Expense.date < today.date()
            ).all()
            
            html_content = generate_report_html(user, expenses, period_name, start_date, today - timedelta(days=1))
            
            success = send_email(
                to_email=user.email,
                subject=f"Your {period_name} SmartSpend Report",
                html_content=html_content
            )
            
            if success:
                user.last_report_sent_at = today
                db.commit()
                sent_count += 1
                
    return {"message": f"Report job completed. Sent {sent_count} reports."}

@router.post("/force-trigger")
def force_trigger_reports(db: Session = Depends(get_db)):
    """
    Force triggers sending of email reports for ALL users for testing purposes.
    Bypasses day-of-week and day-of-month checks.
    """
    today = datetime.now()
    logger.info("Starting FORCE report generation process...")
    sent_count = 0
    
    users = db.query(User).filter(User.report_frequency.in_(["WEEKLY", "MONTHLY"])).all()
    
    for user in users:
        # Calculate last 7 days for the test report
        start_date = today - timedelta(days=7)
        period_name = "Test (Last 7 Days)"
        
        # Fetch expenses
        expenses = db.query(Expense).filter(
            Expense.user_id == user.id,
            Expense.date >= start_date.date(),
            Expense.date <= today.date()
        ).all()
        
        html_content = generate_report_html(user, expenses, period_name, start_date, today)
        
        success = send_email(
            to_email=user.email,
            subject=f"Your {period_name} SmartSpend Report",
            html_content=html_content
        )
        
        if success:
            sent_count += 1
                
    return {"message": f"Force report job completed. Sent {sent_count} test reports."}
