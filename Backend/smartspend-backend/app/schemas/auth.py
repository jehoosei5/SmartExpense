from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    default_currency: str = "GHS"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    default_currency: str
    is_oauth_user: bool
    is_onboarded: bool
    tracking_focus: str | None = None

    class Config:
        from_attributes = True

class OnboardingRequest(BaseModel):
    tracking_focus: str
    main_income_source: str
    monthly_income_range: str
    payment_methods: list[str]
    top_categories: list[str]