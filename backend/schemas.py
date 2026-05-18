from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_verified: bool
    can_vote: bool
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# --- Photo & Match Schemas ---
class PhotoBase(BaseModel):
    id: int
    image_url: str

    class Config:
        orm_mode = True
        from_attributes = True


class MatchResponse(BaseModel):
    photo_a: PhotoBase
    photo_b: PhotoBase
    votes_today: int
    daily_limit: int


class VoteSubmit(BaseModel):
    photo_a_id: int
    photo_b_id: int
    winner_id: int


class LeaderboardEntry(BaseModel):
    id: int
    image_url: str
    elo_rating: float
    matches_played: int

    class Config:
        orm_mode = True
        from_attributes = True


class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    key: str
    value: str

    class Config:
        orm_mode = True
        from_attributes = True


class PhotoUpdate(BaseModel):
    elo_rating: Optional[float] = None
    filename: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: str


class UserApprovalUpdate(BaseModel):
    can_vote: bool


from typing import List


class BulkDeleteUsers(BaseModel):
    user_ids: List[int]


class TournamentMatchResponse(BaseModel):
    id: int
    round_number: int
    match_index: int
    photo_a: Optional[PhotoBase] = None
    photo_b: Optional[PhotoBase] = None
    winner: Optional[PhotoBase] = None
    votes_a: int
    votes_b: int
    is_active: bool
    has_voted: bool = False

    class Config:
        orm_mode = True
        from_attributes = True


class TournamentVoteSubmit(BaseModel):
    tournament_match_id: int
    selected_photo_id: int
