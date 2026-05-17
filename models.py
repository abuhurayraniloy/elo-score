from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    is_verified = Column(Boolean, default=True)
    can_vote = Column(Boolean, default=False)
    verification_token = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    matches = relationship("Match", back_populates="user")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)  # e.g., "image1.jpg"
    image_url = Column(String, nullable=False)  # e.g., "/static/image1.jpg"
    elo_rating = Column(Float, default=1200.0)
    matches_played = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships for matches this photo was part of
    matches_as_a = relationship(
        "Match", foreign_keys="[Match.photo_a_id]", back_populates="photo_a"
    )
    matches_as_b = relationship(
        "Match", foreign_keys="[Match.photo_b_id]", back_populates="photo_b"
    )
    matches_won = relationship(
        "Match", foreign_keys="[Match.winner_id]", back_populates="winner"
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    photo_a_id = Column(Integer, ForeignKey("photos.id"))
    photo_b_id = Column(Integer, ForeignKey("photos.id"))
    winner_id = Column(Integer, ForeignKey("photos.id"))
    voted_at = Column(DateTime, default=utcnow)
    is_guest = Column(Boolean, default=False)

    user = relationship("User", back_populates="matches")
    photo_a = relationship(
        "Photo", foreign_keys=[photo_a_id], back_populates="matches_as_a"
    )
    photo_b = relationship(
        "Photo", foreign_keys=[photo_b_id], back_populates="matches_as_b"
    )
    winner = relationship(
        "Photo", foreign_keys=[winner_id], back_populates="matches_won"
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
