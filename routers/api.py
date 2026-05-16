from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, crud, models, auth
from database import get_db, supabase
from fastapi import UploadFile, File
import uuid
import os

router = APIRouter(
    prefix="/api",
    tags=["Elo Engine"]
)

@router.get("/next-match")
def get_next_match(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    match = crud.get_next_match(db, user_id=current_user.id)
    if isinstance(match, dict) and match.get("limit_reached"):
        raise HTTPException(status_code=429, detail=match)
    if not match:
        raise HTTPException(status_code=404, detail="No more matches available to vote on")
    return match

@router.post("/submit-vote", status_code=status.HTTP_200_OK)
def submit_vote(
    vote: schemas.VoteSubmit, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        return crud.submit_vote(db, vote, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db)
):
    return crud.get_leaderboard(db)

# --- Admin Settings Endpoints ---

def get_admin_user(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.get("/admin/settings", response_model=List[schemas.SettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    settings = db.query(models.SystemSetting).all()
    if not any(s.key == "daily_vote_limit" for s in settings):
        settings.append(models.SystemSetting(key="daily_vote_limit", value="20"))
    return settings

@router.post("/admin/settings/{key}", response_model=schemas.SettingResponse)
def update_setting(
    key: str,
    setting_in: schemas.SettingUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.set_setting(db, key, setting_in.value)

@router.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured in .env")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    try:
        file_bytes = await file.read()
        
        # Upload to Supabase Storage (bucket must be named 'images')
        supabase.storage.from_("images").upload(unique_filename, file_bytes, {"content-type": file.content_type})
        
        # Get public URL
        public_url = supabase.storage.from_("images").get_public_url(unique_filename)
        
        # Insert into DB
        new_photo = models.Photo(
            filename=unique_filename,
            image_url=public_url,
            elo_rating=1200.0,
            matches_played=0
        )
        db.add(new_photo)
        db.commit()
        
        return {"detail": "Image uploaded successfully", "url": public_url}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.get_system_stats(db)

@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.get_all_users(db)

@router.get("/admin/photos", response_model=List[schemas.LeaderboardEntry])
def get_admin_photos(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return db.query(models.Photo).all()

@router.delete("/admin/photos/{photo_id}")
def delete_admin_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.delete_photo(db, photo_id)

@router.patch("/admin/photos/{photo_id}", response_model=schemas.LeaderboardEntry)
def update_admin_photo(
    photo_id: int,
    update: schemas.PhotoUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    updated = crud.update_photo(db, photo_id, elo_rating=update.elo_rating, filename=update.filename)
    if not updated:
        raise HTTPException(status_code=404, detail="Photo not found")
    return updated

@router.patch("/admin/users/{user_id}", response_model=schemas.UserResponse)
def update_admin_user_role(
    user_id: int,
    update: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    updated = crud.update_user_role(db, user_id, role=update.role)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.patch("/admin/users/{user_id}/approval", response_model=schemas.UserResponse)
def update_admin_user_approval(
    user_id: int,
    update: schemas.UserApprovalUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    updated = crud.update_user_approval(db, user_id, can_vote=update.can_vote)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.delete("/admin/users/{user_id}")
def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.delete_user(db, user_id)

@router.post("/admin/users/bulk-delete")
def bulk_delete_admin_users(
    payload: schemas.BulkDeleteUsers,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    return crud.delete_users_bulk(db, payload.user_ids)
