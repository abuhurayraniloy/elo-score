import os
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import auth

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def get_image_files(directory):
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    image_files = []
    
    if not os.path.exists(directory):
        print(f"Directory {directory} not found.")
        return image_files
        
    for f in os.listdir(directory):
        ext = os.path.splitext(f)[1].lower()
        if ext in valid_extensions:
            image_files.append(f)
            
    return image_files

def seed_db():
    db: Session = SessionLocal()
    
    try:
        # 1. Create Test Admin and Test User
        admin_username = "admin"
        if not db.query(models.User).filter(models.User.username == admin_username).first():
            print("Creating test admin...")
            admin_user = models.User(
                username=admin_username,
                email="admin@example.com",
                hashed_password=auth.get_password_hash("adminpassword"),
                role="admin",
                is_verified=True,
                can_vote=True
            )
            db.add(admin_user)
            
        test_username = "testuser"
        if not db.query(models.User).filter(models.User.username == test_username).first():
            print("Creating test user...")
            test_user = models.User(
                username=test_username,
                email="user@example.com",
                hashed_password=auth.get_password_hash("testpassword"),
                role="user"
            )
            db.add(test_user)
            
        # 1.2 Create specific requested admin: sensei
        sensei_email = "abuhurayraniloy02@gmail.com"
        existing_sensei = db.query(models.User).filter(models.User.email == sensei_email).first()
        if existing_sensei:
            print("Updating existing user to sensei admin...")
            existing_sensei.username = "sensei"
            existing_sensei.role = "admin"
            existing_sensei.is_verified = True
            existing_sensei.can_vote = True
            existing_sensei.hashed_password = auth.get_password_hash("sherlock")
        else:
            print("Creating sensei admin...")
            sensei_admin = models.User(
                username="sensei",
                email=sensei_email,
                hashed_password=auth.get_password_hash("sherlock"),
                role="admin",
                is_verified=True,
                can_vote=True
            )
            db.add(sensei_admin)
            

        # 1.5 Create default settings
        if not db.query(models.SystemSetting).filter(models.SystemSetting.key == "daily_vote_limit").first():
            print("Creating default daily limit setting...")
            db.add(models.SystemSetting(key="daily_vote_limit", value="20"))
            
        db.commit()

        # 2. Seed Photos from Directory
        image_dir = os.getenv("IMAGE_DIR", "D:\\images")
        image_files = get_image_files(image_dir)
        
        if not image_files:
            print("No images found to seed. Please add images to D:\\images")
            return
            
        # Check how many we already have
        current_count = db.query(models.Photo).count()
        if current_count >= len(image_files):
            print(f"Database already has {current_count} photos. Skipping photo seed.")
            return
            
        print(f"Found {len(image_files)} images. Seeding...")
        
        # We only add photos that are not already in DB
        existing_filenames = {p.filename for p in db.query(models.Photo.filename).all()}
        
        new_photos = []
        for filename in image_files:
            if filename not in existing_filenames:
                new_photos.append(
                    models.Photo(
                        filename=filename,
                        image_url=f"/static/{filename}",
                        elo_rating=1200.0,
                        matches_played=0
                    )
                )
                
        if new_photos:
            db.add_all(new_photos)
            db.commit()
            print(f"Successfully seeded {len(new_photos)} new photos.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    seed_db()
