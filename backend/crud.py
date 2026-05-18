from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
import models, schemas, auth
import math

# --- Auth CRUD ---


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(
    db: Session,
    user: schemas.UserCreate,
    role: str = "user",
    is_verified: bool = True,
    verification_token: str = None,
    can_vote: bool = False,
):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
        is_verified=is_verified,
        can_vote=can_vote,
        verification_token=verification_token,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_all_users(db: Session):
    return db.query(models.User).all()


# --- Settings CRUD ---


def get_setting(db: Session, key: str, default: str = None):
    setting = (
        db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    )
    return setting.value if setting else default


def set_setting(db: Session, key: str, value: str):
    setting = (
        db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    )
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
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    # Check reset hour setting (0 to 23, default 0 UTC)
    reset_hour_str = get_setting(db, "daily_reset_hour", "0")
    try:
        reset_hour = int(reset_hour_str)
        reset_hour = max(0, min(23, reset_hour))
    except ValueError:
        reset_hour = 0

    from datetime import datetime, time, timedelta

    now_dt = datetime.utcnow()
    reset_today = datetime.combine(now_dt.date(), time(hour=reset_hour))

    if now_dt >= reset_today:
        last_reset = reset_today
    else:
        last_reset = reset_today - timedelta(days=1)

    next_reset = last_reset + timedelta(days=1)

    # Check daily limit
    limit_str = get_setting(db, "daily_vote_limit", "20")
    try:
        daily_limit = int(limit_str)
    except ValueError:
        daily_limit = 20

    # Count REAL votes cast since the last reset window
    votes_today = (
        db.query(func.count(models.Match.id))
        .filter(
            models.Match.user_id == user_id,
            models.Match.is_guest == False,
            models.Match.voted_at >= last_reset,
        )
        .scalar()
    )

    if votes_today >= daily_limit:
        return {
            "limit_reached": True,
            "limit": daily_limit,
            "next_reset": next_reset.isoformat() + "Z",
        }

    # Get pairs this user has already voted on
    seen_matches = (
        db.query(models.Match.photo_a_id, models.Match.photo_b_id)
        .filter(models.Match.user_id == user_id)
        .all()
    )

    seen_ids = set()
    for a, b in seen_matches:
        seen_ids.add(tuple(sorted((a, b))))

    # Matchmaking Logic:
    # 1. Get relevant photos based on approval status
    # Check if there are at least 2 user photos in the system (excluding self) to do real voting
    user_photo_count = (
        db.query(models.Photo)
        .filter(models.Photo.user_id != None, models.Photo.user_id != user_id)
        .count()
    )

    is_guest_mode = not user.can_vote or user_photo_count < 2

    if is_guest_mode:
        # GUEST MODE: Only original system photos
        all_photos_a = (
            db.query(models.Photo)
            .filter(models.Photo.user_id == None)
            .order_by(models.Photo.matches_played.asc(), func.random())
            .all()
        )
    else:
        # REAL MODE: Only user photos (excluding self)
        all_photos_a = (
            db.query(models.Photo)
            .filter(models.Photo.user_id != None, models.Photo.user_id != user_id)
            .order_by(models.Photo.matches_played.asc(), func.random())
            .all()
        )

    if not all_photos_a:
        return None

    for photo_a in all_photos_a:
        if is_guest_mode:
            photo_b_candidates = (
                db.query(models.Photo)
                .filter(models.Photo.id != photo_a.id, models.Photo.user_id == None)
                .order_by(
                    func.abs(models.Photo.elo_rating - photo_a.elo_rating).asc(),
                    func.random(),
                )
                .all()
            )
        else:
            photo_b_candidates = (
                db.query(models.Photo)
                .filter(
                    models.Photo.id != photo_a.id,
                    models.Photo.user_id != None,
                    models.Photo.user_id != user_id,
                )
                .order_by(
                    func.abs(models.Photo.elo_rating - photo_a.elo_rating).asc(),
                    func.random(),
                )
                .all()
            )

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
                "daily_limit": daily_limit,
                "is_guest": is_guest_mode,
                "no_real_photos": user.can_vote and user_photo_count < 2,
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
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    # Fetch photos
    photo_a = (
        db.query(models.Photo)
        .filter(models.Photo.id == vote.photo_a_id)
        .with_for_update()
        .first()
    )
    photo_b = (
        db.query(models.Photo)
        .filter(models.Photo.id == vote.photo_b_id)
        .with_for_update()
        .first()
    )

    if not photo_a or not photo_b:
        raise ValueError("Photo not found")

    if photo_a.user_id == user_id or photo_b.user_id == user_id:
        raise ValueError("You cannot vote on your own photo")

    old_r_a = photo_a.elo_rating
    old_r_b = photo_b.elo_rating

    score_a = 1 if vote.winner_id == photo_a.id else 0

    new_r_a, new_r_b = calculate_elo(
        old_r_a, old_r_b, score_a, photo_a.matches_played, photo_b.matches_played
    )

    # Update photos and Elo only if approved AND this is a real user-to-user match
    is_guest_vote = (
        not user.can_vote or photo_a.user_id is None or photo_b.user_id is None
    )

    if not is_guest_vote:
        photo_a.elo_rating = new_r_a
        photo_a.matches_played += 1

        photo_b.elo_rating = new_r_b
        photo_b.matches_played += 1

    # Create Match record
    new_match = models.Match(
        user_id=user_id,
        photo_a_id=photo_a.id,
        photo_b_id=photo_b.id,
        winner_id=vote.winner_id,
        is_guest=is_guest_vote,
    )

    db.add(new_match)
    db.commit()

    return {
        "is_guest": is_guest_vote,
        "photo_a": {
            "id": photo_a.id,
            "old_rating": old_r_a,
            "new_rating": new_r_a,
            "change": new_r_a - old_r_a,
        },
        "photo_b": {
            "id": photo_b.id,
            "old_rating": old_r_b,
            "new_rating": new_r_b,
            "change": new_r_b - old_r_b,
        },
    }


def get_leaderboard(db: Session):
    return (
        db.query(models.Photo)
        .filter(models.Photo.user_id != None)
        .order_by(models.Photo.elo_rating.desc())
        .all()
    )


def delete_photo(db: Session, photo_id: int):
    db.query(models.Photo).filter(models.Photo.id == photo_id).delete()
    db.commit()
    return True


def update_photo(
    db: Session, photo_id: int, elo_rating: float = None, filename: str = None
):
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


def update_user_approval(db: Session, user_id: int, can_vote: bool):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    db_user.can_vote = can_vote
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    # Delete associated photos
    db.query(models.Photo).filter(models.Photo.user_id == user_id).delete()
    # Delete associated matches
    db.query(models.Match).filter(models.Match.user_id == user_id).delete()
    # Delete user
    db.query(models.User).filter(models.User.id == user_id).delete()
    db.commit()
    return True


def delete_users_bulk(db: Session, user_ids: list[int]):
    # Delete associated photos
    db.query(models.Photo).filter(models.Photo.user_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    # Delete associated matches
    db.query(models.Match).filter(models.Match.user_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    # Delete users
    db.query(models.User).filter(models.User.id.in_(user_ids)).delete(
        synchronize_session=False
    )
    db.commit()
    return True


def get_system_stats(db: Session):
    total_users = db.query(func.count(models.User.id)).scalar()
    total_photos = db.query(func.count(models.Photo.id)).scalar()
    total_real_photos = (
        db.query(func.count(models.Photo.id))
        .filter(models.Photo.user_id != None)
        .scalar()
    )
    # Only count real non-guest votes
    total_votes = (
        db.query(func.count(models.Match.id))
        .filter(models.Match.is_guest == False)
        .scalar()
    )

    # Top rating is strictly the highest rated USER photo
    top_photo = (
        db.query(models.Photo)
        .filter(models.Photo.user_id != None)
        .order_by(models.Photo.elo_rating.desc())
        .first()
    )

    return {
        "total_users": total_users,
        "total_photos": total_photos,
        "total_real_photos": total_real_photos,
        "total_votes": total_votes,
        "top_photo": top_photo,
    }


def get_tournament_bracket(db: Session):
    return (
        db.query(models.TournamentMatch)
        .order_by(
            models.TournamentMatch.round_number, models.TournamentMatch.match_index
        )
        .all()
    )


def submit_tournament_vote(
    db: Session, vote: schemas.TournamentVoteSubmit, user_id: int
):
    match = (
        db.query(models.TournamentMatch)
        .filter(models.TournamentMatch.id == vote.tournament_match_id)
        .first()
    )
    if not match:
        raise ValueError("Match-up not found")
    if not match.is_active:
        raise ValueError("This match-up is not active for voting")
    if vote.selected_photo_id not in (match.photo_a_id, match.photo_b_id):
        raise ValueError("Invalid photo selection for this match-up")

    # Check if user already voted
    existing_vote = (
        db.query(models.TournamentVote)
        .filter(
            models.TournamentVote.user_id == user_id,
            models.TournamentVote.tournament_match_id == vote.tournament_match_id,
        )
        .first()
    )
    if existing_vote:
        raise ValueError("You have already voted on this match-up")

    # Create Vote
    new_vote = models.TournamentVote(
        user_id=user_id,
        tournament_match_id=vote.tournament_match_id,
        selected_photo_id=vote.selected_photo_id,
    )
    db.add(new_vote)

    # Increment tallies
    if vote.selected_photo_id == match.photo_a_id:
        match.votes_a += 1
    else:
        match.votes_b += 1

    db.commit()
    db.refresh(match)
    return match


import random


def advance_tournament_round(db: Session):
    # Find the active round
    active_match = (
        db.query(models.TournamentMatch)
        .filter(models.TournamentMatch.is_active == True)
        .first()
    )
    if not active_match:
        # If no round is active, we find the first round (Round of 32) that hasn't completed yet
        first_incomplete = (
            db.query(models.TournamentMatch)
            .filter(models.TournamentMatch.winner_id == None)
            .order_by(models.TournamentMatch.round_number.asc())
            .first()
        )
        if not first_incomplete:
            raise ValueError(
                "Tournament is already complete! You can reset it to start again."
            )
        active_round = first_incomplete.round_number
    else:
        active_round = active_match.round_number

    # Get all matches in this active round
    active_matches = (
        db.query(models.TournamentMatch)
        .filter(models.TournamentMatch.round_number == active_round)
        .all()
    )

    # Tally winners and promote
    winners = []
    for match in active_matches:
        # Skip if participants are missing
        if not match.photo_a_id or not match.photo_b_id:
            continue

        # Determine winner
        if match.votes_a > match.votes_b:
            winner_id = match.photo_a_id
        elif match.votes_b > match.votes_a:
            winner_id = match.photo_b_id
        else:
            # Tie breaker: random
            winner_id = random.choice([match.photo_a_id, match.photo_b_id])

        match.winner_id = winner_id
        match.is_active = False
        winners.append(winner_id)

        # Promote to the next round if active_round < 5 (Finals)
        if active_round < 5:
            next_round = active_round + 1
            next_match_index = match.match_index // 2
            is_photo_a = match.match_index % 2 == 0

            next_match = (
                db.query(models.TournamentMatch)
                .filter(
                    models.TournamentMatch.round_number == next_round,
                    models.TournamentMatch.match_index == next_match_index,
                )
                .first()
            )
            if next_match:
                if is_photo_a:
                    next_match.photo_a_id = winner_id
                else:
                    next_match.photo_b_id = winner_id

    # Activate the next round
    if active_round < 5:
        next_matches = (
            db.query(models.TournamentMatch)
            .filter(models.TournamentMatch.round_number == active_round + 1)
            .all()
        )
        for nm in next_matches:
            # Only activate if both participants are present
            if nm.photo_a_id and nm.photo_b_id:
                nm.is_active = True

    db.commit()
    return {"advanced_from": active_round, "winners_count": len(winners)}


def reset_tournament(db: Session):
    # Clear votes
    db.query(models.TournamentVote).delete()

    # Reset all matches
    matches = db.query(models.TournamentMatch).all()
    for m in matches:
        m.votes_a = 0
        m.votes_b = 0
        m.winner_id = None
        m.is_active = m.round_number == 1  # Only activate Round 1 (Round of 32)
        if m.round_number > 1:
            m.photo_a_id = None
            m.photo_b_id = None

    # Re-seed Round of 32 (round 1)
    photos = db.query(models.Photo).filter(models.Photo.user_id == None).all()
    if len(photos) >= 32:
        for i in range(16):
            m = (
                db.query(models.TournamentMatch)
                .filter(
                    models.TournamentMatch.round_number == 1,
                    models.TournamentMatch.match_index == i,
                )
                .first()
            )
            if m:
                m.photo_a_id = photos[2 * i].id
                m.photo_b_id = photos[2 * i + 1].id
                m.is_active = True

    db.commit()
    return {"detail": "Tournament has been reset successfully"}


def hard_reset_system(db: Session):
    # Clear all standard matches
    db.query(models.Match).delete()
    
    # Reset all photos to 1200 ELO and 0 matches
    photos = db.query(models.Photo).all()
    for p in photos:
        p.elo_rating = 1200.0
        p.matches_played = 0
    
    # Call standard tournament reset logic
    # Clear votes
    db.query(models.TournamentVote).delete()

    # Reset all matches
    tourn_matches = db.query(models.TournamentMatch).all()
    for m in tourn_matches:
        m.votes_a = 0
        m.votes_b = 0
        m.winner_id = None
        m.is_active = m.round_number == 1  # Only activate Round 1 (Round of 32)
        if m.round_number > 1:
            m.photo_a_id = None
            m.photo_b_id = None

    # Re-seed Round of 32 (round 1)
    system_photos = [p for p in photos if p.user_id is None]
    if len(system_photos) >= 32:
        for i in range(16):
            m = (
                db.query(models.TournamentMatch)
                .filter(
                    models.TournamentMatch.round_number == 1,
                    models.TournamentMatch.match_index == i,
                )
                .first()
            )
            if m:
                m.photo_a_id = system_photos[2 * i].id
                m.photo_b_id = system_photos[2 * i + 1].id
                m.is_active = True

    db.commit()
    return {"detail": "System has been hard reset successfully. All votes cleared and scores reset to 1200."}

