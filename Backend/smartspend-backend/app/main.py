from fastapi import FastAPI, Depends
from app.utils.security import get_current_user
from app.models import User
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.routers import auth, expenses, sync, ai, charts, categories, budgets
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.utils.rate_limit import limiter
from app.config import settings

from app.models.category import Category
from app.database import SessionLocal

try:
    print("Creating database tables...", flush=True)
    Base.metadata.create_all(bind=engine)
    print("Database tables created.", flush=True)
    
    # Seed default categories if none exist
    print("Seeding default categories...", flush=True)
    db = SessionLocal()
    if db.query(Category).count() == 0:
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
    print("Seeding complete.", flush=True)
except Exception as e:
    print(f"Error creating database tables: {e}", flush=True)
    
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
app.include_router(budgets.router)

@app.get("/")
@app.head("/")
def root():
    return {"message": "SmartSpend AI API is running"}

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/migrate")
def migrate_db():
    from scripts.migrate_postgres import run_migration
    try:
        run_migration()
        return {"message": "Migration completed. Check Render logs for details."}
    except Exception as e:
        return {"error": str(e)}
