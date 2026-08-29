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

MAX_OTP_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def generate_and_send_otp(db: Session, email: str) -> bool:
    # Invalidate previous OTPs for this email
    db.query(OTP).filter(OTP.email == email, OTP.purpose == "VERIFICATION").delete()

    code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    otp = OTP(
        email=email,
        code=code,
        purpose="VERIFICATION",
        attempts=0,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    return send_verification_email(email, code)


def register_user(db: Session, data: RegisterRequest):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        return None, "Email already registered"

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
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return None, None, "Invalid email or password"

    if user.is_oauth_user:
        return None, None, "This email is registered with Google. Please use 'Sign in with Google'."

    if not verify_password(data.password, user.password_hash):
        return None, None, "Invalid email or password"

    if not user.is_verified:
        return None, None, "UNVERIFIED_ACCOUNT"

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_token)
    db.commit()

    return access_token, refresh_token, None


def logout_user(db: Session, refresh_token: str):
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if db_token:
        db_token.revoked = 1
        db.commit()
    return True


def _persist_refresh_token(db: Session, user_id: str, refresh_token: str) -> None:
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db.add(
        RefreshToken(
            user_id=str(user_id),
            token_hash=token_hash,
            expires_at=datetime.utcnow()
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )


def refresh_access_token(db: Session, refresh_token: str):
    from app.utils.security import decode_token

    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        return None, None, "Invalid or expired refresh token"

    user_id = payload.get("sub")
    if not user_id:
        return None, None, "Invalid or expired refresh token"

    user_id = str(user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None, None, "Invalid or expired refresh token"

    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if not db_token or str(db_token.user_id) != user_id:
        return None, None, "Invalid or expired refresh token"

    if db_token.revoked:
        return None, None, "Refresh token has been revoked"

    expires_at = db_token.expires_at
    if getattr(expires_at, "tzinfo", None) is not None:
        expires_at = expires_at.replace(tzinfo=None)
    if expires_at < datetime.utcnow():
        db_token.revoked = 1
        db.commit()
        return None, None, "Refresh token expired"

    # Rotate refresh token
    db_token.revoked = 1
    new_access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})
    _persist_refresh_token(db, user_id, new_refresh_token)
    db.commit()

    return new_access_token, new_refresh_token, None


def verify_email_code(db: Session, email: str, code: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None, None, "User not found"

    otp = db.query(OTP).filter(OTP.email == email, OTP.purpose == "VERIFICATION").first()
    if not otp:
        return None, None, "No verification code found. Please request a new one."

    if not otp.is_valid():
        db.delete(otp)
        db.commit()
        return None, None, "Verification code expired. Please request a new one."

    if otp.code != code:
        otp.attempts = (otp.attempts or 0) + 1
        if otp.attempts >= MAX_OTP_ATTEMPTS:
            db.delete(otp)
            db.commit()
            return None, None, "Too many invalid attempts. Please request a new code."
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - otp.attempts
        return None, None, f"Invalid verification code. {remaining} attempt(s) remaining."

    user.is_verified = True
    db.delete(otp)
    db.commit()

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

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

    existing = db.query(OTP).filter(
        OTP.email == email,
        OTP.purpose == "VERIFICATION",
    ).first()
    if existing and existing.created_at:
        created = existing.created_at
        if getattr(created, "tzinfo", None) is not None:
            created = created.replace(tzinfo=None)
        age = (datetime.utcnow() - created).total_seconds()
        if age < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - age)
            return False, f"Please wait {wait} second(s) before requesting a new code."

    generate_and_send_otp(db, email)
    return True, None
