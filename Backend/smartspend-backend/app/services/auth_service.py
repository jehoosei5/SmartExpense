from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token
)
from app.config import settings
import hashlib

def register_user(db: Session, data: RegisterRequest):
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        return None, "Email already registered"

    # Create new user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        default_currency=data.default_currency
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, None


def login_user(db: Session, data: LoginRequest):
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return None, None, "Invalid email or password"

    # Check if this is a Google OAuth user (random 64-char hex password)
    is_oauth = len(user.password_hash) > 60
    if is_oauth:
        return None, None, "This email is registered with Google. Please use 'Sign in with Google'."

    # Verify password
    if not verify_password(data.password, user.password_hash):
        return None, None, "Invalid email or password"

    # Generate tokens
    access_token  = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    # Hash the refresh token before storing
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    # Save refresh token to database
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_token)
    db.commit()

    return access_token, refresh_token, None


def logout_user(db: Session, refresh_token: str):
    # Hash the token to find it in the database
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    # Mark it as revoked
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if db_token:
        db_token.revoked = 1
        db.commit()
    return True