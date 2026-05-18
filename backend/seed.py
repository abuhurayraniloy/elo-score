import os
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import auth

# Ensure tables are created
Base.metadata.create_all(bind=engine)

# 32 high-quality Unsplash sports and soccer aesthetic photo IDs
UNSPLASH_IDS = [
    "photo-1508098682722-e99c43a406b2",  # Ball on turf
    "photo-1518063319789-7217e6706b04",  # Player kick
    "photo-1579952362864-aa3d334515c1",  # Cleat & ball
    "photo-1551958219-acbc608c6377",  # Pitch
    "photo-1517466787929-bc90951d0974",  # Action shot
    "photo-1543351611-58f69d7c1781",  # Stadium lights
    "photo-1568194157720-0c2f183995c6",  # Goalkeeper dive
    "photo-1504305754058-2f08ccd89a0a",  # Kids playing
    "photo-1529900748604-07564a03e7a6",  # Professional arena
    "photo-1552667466-07770ae110d0",  # Training session
    "photo-1606925797300-0b35e9d17677",  # Vintage football
    "photo-1516567727-4b6e8a8a8a25",  # Fans cheering
    "photo-1517927033932-b3d18e61fb3a",  # Goal post
    "photo-1509048191080-d2984bad6ae5",  # Cleats close up
    "photo-1531415074968-036ba1b575da",  # Grass texture
    "photo-1431324155629-1a6edd1dec1d",  # Football match
    "photo-1517649763962-0c623066013b",  # Running track
    "photo-1502082553048-f009c37129b9",  # Running shoe
    "photo-1461896836934-ffe607ba8211",  # Athlete starting line
    "photo-1530541930197-ff16ac917b0e",  # Trophy
    "photo-1541534741688-6078c6bfb5c5",  # Gym training
    "photo-1517838277536-f5f99be501cd",  # Fitness close up
    "photo-1476480862126-209bfaa8edc8",  # Outdoor trail
    "photo-1486218119243-13883505764c",  # Cycling
    "photo-1518622358385-8ea7d0794bf6",  # Basketball net
    "photo-1535131749006-b7f58c99034b",  # Tennis court
    "photo-1524413840807-0c3cb6fa808d",  # Running race
    "photo-1551698618-1ffd5f97df44",  # Skateboarder
    "photo-1519766304817-4f37bda74a27",  # Crowd lights
    "photo-1516567727-4b6e8a8a25",  # Team huddle
    "photo-1553969420-fb9152281a3d",  # Sports field lines
    "photo-1544698310-74ea9d1c8258",  # Medal ceremony
]


def seed_db():
    db: Session = SessionLocal()

    try:
        # 1. Create Test Admin and Test User
        admin_username = "admin"
        if (
            not db.query(models.User)
            .filter(models.User.username == admin_username)
            .first()
        ):
            print("Creating test admin...")
            admin_user = models.User(
                username=admin_username,
                email="admin@example.com",
                hashed_password=auth.get_password_hash("adminpassword"),
                role="admin",
                is_verified=True,
                can_vote=True,
            )
            db.add(admin_user)

        test_username = "testuser"
        if (
            not db.query(models.User)
            .filter(models.User.username == test_username)
            .first()
        ):
            print("Creating test user...")
            test_user = models.User(
                username=test_username,
                email="user@example.com",
                hashed_password=auth.get_password_hash("testpassword"),
                role="user",
                is_verified=True,
                can_vote=True,
            )
            db.add(test_user)

        # Create sensei admin
        sensei_email = "abuhurayraniloy02@gmail.com"
        existing_sensei = (
            db.query(models.User).filter(models.User.email == sensei_email).first()
        )
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
                can_vote=True,
            )
            db.add(sensei_admin)

        db.commit()

        # 2. Seed Photos (ensure we have exactly 32 system photos)
        db.query(models.Photo).filter(models.Photo.user_id == None).delete()
        db.commit()

        print("Seeding 32 system-provided photos...")
        seeded_photos = []
        for i, photo_id in enumerate(UNSPLASH_IDS):
            p = models.Photo(
                filename=f"unsplash_{photo_id}.jpg",
                image_url=f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=600&q=80",
                elo_rating=1200.0,
                matches_played=0,
                user_id=None,
            )
            db.add(p)
            seeded_photos.append(p)

        db.commit()
        for p in seeded_photos:
            db.refresh(p)

        # 3. Seed Tournament Match Slots (31 matches total)
        # Clear existing tournament matches
        db.query(models.TournamentVote).delete()
        db.query(models.TournamentMatch).delete()
        db.commit()

        print("Initializing 31 tournament matches...")
        matches_to_create = []

        # Round 1: Round of 32 (16 matches, round_number = 1, indices 0-15)
        for i in range(16):
            matches_to_create.append(
                models.TournamentMatch(
                    round_number=1,
                    match_index=i,
                    photo_a_id=seeded_photos[2 * i].id,
                    photo_b_id=seeded_photos[2 * i + 1].id,
                    is_active=True,
                )
            )

        # Round 2: Round of 16 (8 matches, round_number = 2, indices 0-7)
        for i in range(8):
            matches_to_create.append(
                models.TournamentMatch(
                    round_number=2,
                    match_index=i,
                    photo_a_id=None,
                    photo_b_id=None,
                    is_active=False,
                )
            )

        # Round 3: Round of 8 (4 matches, round_number = 3, indices 0-3)
        for i in range(4):
            matches_to_create.append(
                models.TournamentMatch(
                    round_number=3,
                    match_index=i,
                    photo_a_id=None,
                    photo_b_id=None,
                    is_active=False,
                )
            )

        # Round 4: Semifinals (2 matches, round_number = 4, indices 0-1)
        for i in range(2):
            matches_to_create.append(
                models.TournamentMatch(
                    round_number=4,
                    match_index=i,
                    photo_a_id=None,
                    photo_b_id=None,
                    is_active=False,
                )
            )

        # Round 5: Finals (1 match, round_number = 5, index 0)
        matches_to_create.append(
            models.TournamentMatch(
                round_number=5,
                match_index=0,
                photo_a_id=None,
                photo_b_id=None,
                is_active=False,
            )
        )

        db.add_all(matches_to_create)
        db.commit()
        print("Successfully seeded 31 tournament bracket matches!")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
