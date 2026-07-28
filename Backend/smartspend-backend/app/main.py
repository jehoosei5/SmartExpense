from fastapi import FastAPI, Depends
from app.utils.security import get_current_user
from app.models import User
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.routers import auth, expenses, sync, ai, charts, categories
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.utils.rate_limit import limiter
from app.config import settings

from app.models.category import Category
from app.database import SessionLocal

try:
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed default categories if none exist
    db = SessionLocal()
    if db.query(Category).filter(Category.user_id == None).count() == 0:
        defaults = [
            ("Food", "Expenses"), ("Transportation", "Expenses"), ("Utilities", "Expenses"),
            ("Clothing", "Expenses"), ("Body Care & Medicine", "Expenses"), ("Entertainment", "Expenses"),
            ("Media", "Expenses"), ("Education", "Expenses"), ("Other", "Expenses"),
            ("Employment (NSS)", "Income"), ("Side Hustle", "Income"), ("Dividend", "Income"),
            ("Freelance", "Income"), ("Mini Business", "Income"), ("Other", "Income"),
            ("Emergency Fund", "Savings"), ("Future Account", "Savings"), ("Investment", "Savings"), ("Other", "Savings")
        ]
        for name, ctype in defaults:
            db.add(Category(name=name, type=ctype, is_default=1, user_id=None))
        db.commit()
    db.close()
except Exception as e:
    print(f"Error creating database tables: {e}")
    
app = FastAPI(
    title="SmartSpend AI", 
    description="AI-powered expense tracking and analysis platform", 
    version="1.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(sync.router)   
app.include_router(ai.router)
app.include_router(charts.router)
app.include_router(categories.router)

@app.get("/")
def root():
    return {"message": "SmartSpend AI API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
