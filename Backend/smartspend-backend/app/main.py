from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import auth, expenses, sync, ai, charts, categories, budgets, reports, alerts
from app.startup import init_database
from app.utils.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="SmartSpend AI",
    description="AI-powered expense tracking and analysis platform",
    version="1.0",
    lifespan=lifespan,
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
app.include_router(reports.router)
app.include_router(alerts.router)


@app.get("/")
@app.head("/")
def root():
    return {"message": "SmartSpend AI API is running"}


@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/migrate")
def migrate_db(x_cron_secret: Optional[str] = Header(None)):
    """
    Runs Postgres column migrations. Protected by X-Cron-Secret —
    do not expose this without authentication.
    """
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    from scripts.migrate_postgres import run_migration
    try:
        run_migration()
        return {"message": "Migration completed. Check Render logs for details."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
