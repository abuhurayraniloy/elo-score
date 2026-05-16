from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
import schemas, crud, auth, models
from database import get_db, supabase
import uuid
import os

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse)
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check existing
    if crud.get_user_by_username(db, username=username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if crud.get_user_by_email(db, email=email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create user (unapproved by default)
    user_create = schemas.UserCreate(username=username, email=email, password=password)
    new_user = crud.create_user(db=db, user=user_create, can_vote=False)
    
    # Upload photo
    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_id = uuid.uuid4()
        file_name = f"profiles/{unique_id}{file_ext}"
        content = await file.read()
        
        if supabase:
            # Upload to 'images' bucket
            supabase.storage.from_("images").upload(file_name, content, {"content-type": file.content_type})
            image_url = supabase.storage.from_("images").get_public_url(file_name)
        else:
            # Fallback to local
            image_dir = os.getenv("IMAGE_DIR", "D:\\images")
            local_dir = os.path.join(image_dir, "profiles")
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, f"{unique_id}{file_ext}")
            with open(local_path, "wb") as f:
                f.write(content)
            image_url = f"/static/profiles/{unique_id}{file_ext}"
            
        # Create photo record linked to user
        new_photo = models.Photo(
            filename=file.filename,
            image_url=image_url,
            user_id=new_user.id,
            elo_rating=1200.0,
            matches_played=0
        )
        db.add(new_photo)
        db.commit()
        db.refresh(new_user)
        
    except Exception as e:
        # Rollback the created user to keep database consistent and clean
        db.delete(new_user)
        db.commit()
        print(f"Error during registration photo upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile photo: {str(e)}"
        )
        
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
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
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
