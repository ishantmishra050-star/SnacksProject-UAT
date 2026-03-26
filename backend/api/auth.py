import time
import html
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.schemas import UserRegister, UserLogin, Token, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from ..utils.email import send_password_reset_email
from ..utils.security import (
    hash_password, verify_password, create_access_token,
    decode_token, oauth2_scheme, validate_password_strength,
    create_reset_token, verify_reset_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ─── Simple in-memory rate limiter ───
_login_attempts = defaultdict(list)  # IP -> [timestamps]
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300  # 5-minute window


def _check_rate_limit(request: Request):
    """Block if too many login attempts from same IP."""
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0] if forwarded else (request.client.host if request.client else "unknown")
    now = time.time()
    # Clean old entries
    _login_attempts[client_ip] = [
        t for t in _login_attempts[client_ip] if now - t < LOGIN_WINDOW_SECONDS
    ]
    if len(_login_attempts[client_ip]) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {LOGIN_WINDOW_SECONDS // 60} minutes.",
        )
    _login_attempts[client_ip].append(now)


def _sanitize(value: str) -> str:
    """Escape HTML to prevent stored XSS."""
    return html.escape(value.strip()) if value else value


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Validate password strength
    validate_password_strength(data.password)

    # Check for duplicate email
    if db.query(User).filter(User.email == data.email.lower().strip()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Sanitize user inputs
    user = User(
        email=data.email.lower().strip(),
        name=_sanitize(data.name),
        password_hash=hash_password(data.password),
        phone=_sanitize(data.phone) if data.phone else None,
        country=_sanitize(data.country),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    # Rate limiting
    _check_rate_limit(request)

    identifier = data.identifier.strip()
    
    # Determine if identifier is email or phone
    import re
    is_email = '@' in identifier
    if is_email:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        # Normalize phone: strip spaces, dashes, parentheses
        phone_clean = re.sub(r'[\s\-\(\)]+', '', identifier)
        user = db.query(User).filter(User.phone == phone_clean).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": token}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if user:
        token = create_reset_token(user.email, user.password_hash)
        reset_link = f"https://snacks-project.vercel.app/reset-password?token={token}"
        
        # Schedule the email sending as a background task
        background_tasks.add_task(send_password_reset_email, user.email, reset_link)
        
    return {"message": "If that email is registered, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    validate_password_strength(data.new_password)
    payload = verify_reset_token(data.token)
    email = payload.get("sub")
    pwd_fragment = payload.get("pwd")
    
    user = db.query(User).filter(User.email == email).first()
    # Ensure user exists and the token hasn't been used (password fragment matches)
    if not user or pwd_fragment != user.password_hash[-10:]:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password has been successfully reset."}
