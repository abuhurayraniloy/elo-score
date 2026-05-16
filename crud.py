from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
import models, schemas, auth
import math

# --- Auth CRUD ---

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, role: str = "user", is_verified: bool = True, verification_token: str = None):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
        is_verified=is_verified,
        verification_token=verification_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(models.User).all()

# --- Settings CRUD ---

def get_setting(db: Session, key: str, default: str = None):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    return setting.value if setting else default

def set_setting(db: Session, key: str, value: str):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = models.SystemSetting(key=key, value=value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

# --- Matchmaking & Elo CRUD ---

def get_next_match(db: Session, user_id: int):
    # Check daily limit
    limit_str = get_setting(db, "daily_vote_limit", "20")
    try:
        daily_limit = int(limit_str)
    except ValueError:
        daily_limit = 20

    # Count votes today
    today = func.date(models.Match.voted_at)
    votes_today = db.query(func.count(models.Match.id)).filter(
        models.Match.user_id == user_id,
        func.date(models.Match.voted_at) == func.date(func.now())
    ).scalar()

    if votes_today >= daily_limit:
        return {"limit_reached": True, "limit": daily_limit}

    # Get pairs this user has already voted on
    seen_matches = db.query(models.Match.photo_a_id, models.Match.photo_b_id).filter(
        models.Match.user_id == user_id
    ).all()
    
    seen_ids = set()
    for a, b in seen_matches:
        seen_ids.add(tuple(sorted((a, b))))

    # Matchmaking Logic:
    # 1. Get all photos
    # 2. Find photo with least matches_played
    # 3. Find opponent with similar Elo that hasn't been matched with photo A by this user
    
    all_photos_a = db.query(models.Photo).order_by(models.Photo.matches_played.asc(), func.random()).all()
    if not all_photos_a:
        return None

    for photo_a in all_photos_a:
        photo_b_candidates = db.query(models.Photo).filter(
            models.Photo.id != photo_a.id
        ).order_by(
            func.abs(models.Photo.elo_rating - photo_a.elo_rating).asc(),
            func.random()
        ).all()

        # Filter out seen pairs
        match_b = None
        for p in photo_b_candidates:
            pair = tuple(sorted((photo_a.id, p.id)))
            if pair not in seen_ids:
                match_b = p
                break
        
        if match_b:
            return {
                "photo_a": photo_a, 
                "photo_b": match_b,
                "votes_today": votes_today,
                "daily_limit": daily_limit
            }
            
    return None

def calculate_elo(r_a, r_b, score_a, matches_a, matches_b):
    # Expected outcome
    e_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    e_b = 1 / (1 + 10 ** ((r_a - r_b) / 400))
    
    # K-Factor
    k_a = 64 if matches_a < 5 else 16
    k_b = 64 if matches_b < 5 else 16
    
    # New Ratings
    new_r_a = r_a + k_a * (score_a - e_a)
    new_r_b = r_b + k_b * ((1 - score_a) - e_b)
    
    return new_r_a, new_r_b

def submit_vote(db: Session, vote: schemas.VoteSubmit, user_id: int):
    # Fetch photos
    photo_a = db.query(models.Photo).filter(models.Photo.id == vote.photo_a_id).with_for_update().first()
    photo_b = db.query(models.Photo).filter(models.Photo.id == vote.photo_b_id).with_for_update().first()
    
    if not photo_a or not photo_b:
        raise ValueError("Photo not found")
        
    if vote.winner_id not in [photo_a.id, photo_b.id]:
        raise ValueError("Winner must be either Photo A or Photo B")

    score_a = 1 if vote.winner_id == photo_a.id else 0
    
    new_r_a, new_r_b = calculate_elo(
        photo_a.elo_rating, photo_b.elo_rating,
        score_a, photo_a.matches_played, photo_b.matches_played
    )
    
    # Update photos
    photo_a.elo_rating = new_r_a
    photo_a.matches_played += 1
    
    photo_b.elo_rating = new_r_b
    photo_b.matches_played += 1
    
    # Create Match record
    new_match = models.Match(
        user_id=user_id,
        photo_a_id=photo_a.id,
        photo_b_id=photo_b.id,
        winner_id=vote.winner_id
    )
    
    db.add(new_match)
    db.commit()
    
    return True

def get_leaderboard(db: Session):
    return db.query(models.Photo).order_by(models.Photo.elo_rating.desc()).all()

def delete_photo(db: Session, photo_id: int):
    db.query(models.Photo).filter(models.Photo.id == photo_id).delete()
    db.commit()
    return True

def update_photo(db: Session, photo_id: int, elo_rating: float = None, filename: str = None):
    db_photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not db_photo:
        return None
    if elo_rating is not None:
        db_photo.elo_rating = elo_rating
    if filename is not None:
        db_photo.filename = filename
    db.commit()
    db.refresh(db_photo)
    return db_photo

def update_user_role(db: Session, user_id: int, role: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    db_user.role = role
    db.commit()
    db.refresh(db_user)
    return db_user

def get_system_stats(db: Session):
    total_users = db.query(func.count(models.User.id)).scalar()
    total_photos = db.query(func.count(models.Photo.id)).scalar()
    total_votes = db.query(func.count(models.Match.id)).scalar()
    
    top_photo = db.query(models.Photo).order_by(models.Photo.elo_rating.desc()).first()
    
    return {
        "total_users": total_users,
        "total_photos": total_photos,
        "total_votes": total_votes,
        "top_photo": top_photo
    }
