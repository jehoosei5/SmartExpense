from app.utils.security import create_access_token, create_refresh_token, get_current_user
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
    ResendVerificationRequest
)
from app.services.auth_service import register_user, login_user, logout_user, verify_email_code, resend_verification_code
from app.utils.security import hash_password


router = APIRouter(prefix="/auth", tags=["Authentication"])


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
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    tokens, error = verify_email_code(db, data.email, data.code)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    return TokenResponse(
        access_token=tokens[0],
        refresh_token=tokens[1]
    )


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
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
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    logout_user(db, data.refresh_token)
    return {"message": "Logged out successfully"}

# Future endpoints for token refresh and Google OAuth
@router.post("/google")
def google_login(payload: dict, db: Session = Depends(get_db)):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        # Verify the token Google sent us
        idinfo = id_token.verify_oauth2_token(
            payload["credential"],
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60
        )

        email        = idinfo["email"]
        display_name = idinfo.get("name", email.split("@")[0])

        # Find existing user or create new one
        user = db.query(User).filter(User.email == email).first()

        if not user:
            from app.utils.security import hash_password
            import secrets
            user = User(
                email=email,
                display_name=display_name,
                password_hash=hash_password(secrets.token_hex(32)),
                default_currency="GHS"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create tokens exactly like normal login
        access_token  = create_access_token({"sub": str(user.id), "type": "access"})
        refresh_token = create_refresh_token({"sub": str(user.id), "type": "refresh"})

        # Save refresh token
        from app.models.refresh_token import RefreshToken
        import hashlib
        from datetime import datetime, timedelta
        hashed = hashlib.sha256(refresh_token.encode()).hexdigest()
        db_token = RefreshToken(
            user_id=str(user.id),
            token_hash=hashed,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(db_token)
        db.commit()

        return {
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "token_type":    "bearer"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    is_oauth = len(current_user.password_hash) > 60 # Placeholder logic to identify Google users
    return {
        "id":               str(current_user.id),
        "email":            current_user.email,
        "display_name":     current_user.display_name,
        "default_currency": current_user.default_currency,
        "report_frequency": current_user.report_frequency,
        "is_oauth_user":   is_oauth
    }

@router.put("/me")
def update_me(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Update display name and currency as usual
    if "display_name" in payload:
        current_user.display_name = payload["display_name"]
    if "default_currency" in payload:
        current_user.default_currency = payload["default_currency"]
    if "report_frequency" in payload:
        current_user.report_frequency = payload["report_frequency"]

    # Modified Password Logic
    if "new_password" in payload:
        # If they are currently OAuth, we DON'T check the old password
        is_oauth = len(current_user.password_hash) > 60
        if not is_oauth:
            from app.utils.security import verify_password
            if not verify_password(payload.get("old_password", ""), current_user.password_hash):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        from app.utils.security import hash_password
        current_user.password_hash = hash_password(payload["new_password"])

    db.commit()
    db.refresh(current_user)
    
    # Return the same structure as get_me
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "display_name": current_user.display_name,
        "default_currency": current_user.default_currency,
        "report_frequency": current_user.report_frequency,
        "is_oauth_user": len(current_user.password_hash) > 60 
    }
    
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Optional: Delete associated refresh tokens first if not handled by CASCADE
    from app.models.refresh_token import RefreshToken
    db.query(RefreshToken).filter(RefreshToken.user_id == str(current_user.id)).delete()

    # Delete the user
    db.delete(current_user)
    db.commit()
    
    return None