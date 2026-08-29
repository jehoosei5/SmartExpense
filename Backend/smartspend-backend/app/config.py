from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
import json

# Known weak defaults — rejected when APP_ENV=production
_INSECURE_CRON_SECRETS = frozenset({
    "changeme",
    "change_me",
    "secret",
    "password",
    "cron_secret",
    "your_secret_here",
})

class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str = "smartspend_db"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    v = json.loads(v)
                except Exception:
                    v = [v]
            else:
                v = [i.strip() for i in v.split(",")]
        if isinstance(v, list):
            return [str(i).rstrip('/') for i in v]
        return v

    # JWT Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o-tenscit"
    AZURE_OPENAI_API_VERSION: str = "2024-12-01-preview"

    # App
    APP_ENV: str = "development"
    
    #Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Email Settings (SMTP)
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    RESEND_API_KEY: str = ""
    
    # Cron / Background Tasks
    CRON_SECRET: str = "changeme"

    @model_validator(mode="after")
    def validate_production_cron_secret(self):
        if self.APP_ENV.lower() != "production":
            return self

        secret = (self.CRON_SECRET or "").strip()
        if len(secret) < 16:
            raise ValueError(
                "CRON_SECRET must be at least 16 characters when APP_ENV=production"
            )
        if secret.lower() in _INSECURE_CRON_SECRETS:
            raise ValueError(
                "CRON_SECRET cannot be a placeholder value when APP_ENV=production"
            )
        return self

    # Pydantic V2 Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",      # Ignores extra variables in .env without crashing
        case_sensitive=False # Allows matching DB_HOST to db_host
    )

settings = Settings()