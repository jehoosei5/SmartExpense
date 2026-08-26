from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.otp import OTP
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token
)
from app.config import settings
from app.utils.email import send_verification_email
import hashlib
import secrets

def generate_and_send_otp(db: Session, email: str) -> bool:
    # Invalidate previous OTPs for this email
    db.query(OTP).filter(OTP.email == email, OTP.purpose == "VERIFICATION").delete()
    
    code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    otp = OTP(email=email, code=code, purpose="VERIFICATION", expires_at=expires_at)
    db.add(otp)
    db.commit()
    
    return send_verification_email(email, code)

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
        default_currency=data.default_currency,
        auth_provider="local",
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    generate_and_send_otp(db, user.email)

    return user, None


def login_user(db: Session, data: LoginRequest):
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return None, None, "Invalid email or password"

    if user.is_oauth_user:
        return None, None, "This email is registered with Google. Please use 'Sign in with Google'."

    if not verify_password(data.password, user.password_hash):
        return None, None, "Invalid email or password"

    if not user.is_verified:
        # We need a special flag to tell the frontend to show the OTP screen
        return None, None, "UNVERIFIED_ACCOUNT"

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

def verify_email_code(db: Session, email: str, code: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None, None, "User not found"
        
    otp = db.query(OTP).filter(OTP.email == email, OTP.purpose == "VERIFICATION").first()
    if not otp:
        return None, None, "No verification code found. Please request a new one."
        
    if otp.code != code:
        return None, None, "Invalid verification code"
        
    if not otp.is_valid():
        db.delete(otp)
        db.commit()
        return None, None, "Verification code expired. Please request a new one."
        
    user.is_verified = True
    db.delete(otp)
    db.commit()
    
    # Auto-login the user after successful verification
    access_token  = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    # Hash the refresh token before storing
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    
    # Store refresh token
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_token)
    db.commit()
    
    return access_token, refresh_token, None

def resend_verification_code(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False, "User not found"
    
    if user.is_verified:
        return False, "User is already verified"
        
    generate_and_send_otp(db, email)
    return True, None