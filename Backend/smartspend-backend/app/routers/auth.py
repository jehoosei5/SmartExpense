from app.utils.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.config import settings

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.rate_limit import limiter
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    OnboardingRequest,
    UpdateProfileRequest,
    UpdatePasswordRequest,
    GoogleLoginRequest,
)
from app.services.auth_service import (
    register_user,
    login_user,
    logout_user,
    verify_email_code,
    resend_verification_code,
    refresh_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

VALID_REPORT_FREQUENCIES = {"NONE", "WEEKLY", "MONTHLY"}


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user, error = register_user(db, data)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return user


@router.post("/verify-email", response_model=TokenResponse)
@limiter.limit("10/minute")
def verify_email(request: Request, data: VerifyEmailRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, error = verify_email_code(db, data.email, data.code)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, data: ResendVerificationRequest, db: Session = Depends(get_db)):
    success, error = resend_verification_code(db, data.email)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return {"message": "Verification code resent"}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, error = login_user(db, data)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error
        )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/logout")
def logout(
    data: RefreshRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success, error = logout_user(db, data.refresh_token, current_user.id)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error,
        )
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
def refresh_tokens(request: Request, data: RefreshRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, error = refresh_access_token(db, data.refresh_token)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
        )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number
    if data.country is not None:
        current_user.country = data.country
    if data.profession is not None:
        current_user.profession = data.profession
    if data.default_currency is not None:
        current_user.default_currency = data.default_currency
    if data.report_frequency is not None:
        if data.report_frequency not in VALID_REPORT_FREQUENCIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="report_frequency must be NONE, WEEKLY, or MONTHLY",
            )
        current_user.report_frequency = data.report_frequency
    if data.tracking_focus is not None and current_user.financial_context:
        current_user.financial_context.tracking_focus = data.tracking_focus

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def update_password(
    data: UpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_oauth_user:
        # OAuth users have no known password — allow setting one without current_password
        current_user.password_hash = hash_password(data.new_password)
    else:
        if not data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required",
            )
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )
        current_user.password_hash = hash_password(data.new_password)

    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/google", response_model=TokenResponse)
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured",
        )

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google token: {str(e)}",
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide an email address",
        )

    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email is not verified. Please verify it with Google and try again.",
        )

    display_name = idinfo.get("name") or email.split("@")[0]
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Google has verified ownership of this email — allow sign-in.
        # Do not rewrite auth_provider: password users stay "local" (both
        # methods work); Google-only users stay "google".
        # Legacy Google accounts may be tagged "local" after the auth_provider
        # backfill — they can still sign in here once Google verifies them.
        if not user.is_verified:
            user.is_verified = True
            db.commit()
        if not user.display_name and display_name:
            user.display_name = display_name
            db.commit()
    else:
        import secrets
        user = User(
            email=email,
            display_name=display_name,
            password_hash=hash_password(secrets.token_hex(32)),
            default_currency="GHS",
            auth_provider="google",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    from app.models.refresh_token import RefreshToken
    import hashlib
    from datetime import datetime, timedelta

    hashed = hashlib.sha256(refresh_token.encode()).hexdigest()
    db.add(
        RefreshToken(
            user_id=str(user.id),
            token_hash=hashed,
            expires_at=datetime.utcnow()
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/onboarding", response_model=UserResponse)
def complete_onboarding(
    payload: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.financial_context import UserFinancialContext

    if current_user.is_onboarded:
        raise HTTPException(status_code=400, detail="User is already onboarded")

    context = UserFinancialContext(
        user_id=str(current_user.id),
        tracking_focus=payload.tracking_focus,
        main_income_source=payload.main_income_source,
        monthly_income_range=payload.monthly_income_range,
        payment_methods=payload.payment_methods,
        top_categories=payload.top_categories
    )

    db.add(context)
    current_user.is_onboarded = True
    current_user.country = payload.country
    current_user.phone_number = payload.phone_number
    current_user.profession = payload.profession
    current_user.default_currency = payload.default_currency
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.refresh_token import RefreshToken
    db.query(RefreshToken).filter(RefreshToken.user_id == str(current_user.id)).delete()

    db.delete(current_user)
    db.commit()

    return None
