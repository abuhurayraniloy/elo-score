from datetime import timedelta
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Form,
    File,
    UploadFile,
    BackgroundTasks,
)
from sqlalchemy.orm import Session
import schemas, crud, auth, models
from database import get_db, supabase
import uuid
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserResponse)
def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    # Check existing
    if crud.get_user_by_username(db, username=username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if crud.get_user_by_email(db, email=email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user (approved by default for tournament voting)
    user_create = schemas.UserCreate(
        username=username, email=email, password=password
    )
    new_user = crud.create_user(db=db, user=user_create, can_vote=True)

    return new_user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, username=username)
    if not user:
        # Also check email
        user = crud.get_user_by_email(db, email=username)

    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
