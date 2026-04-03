from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    full_name: str
    city: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserRead(UserBase):
    id: int
    level: int
    xp: int
    xp_next_level: int

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LocationActivityRead(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)


class LocationRead(BaseModel):
    id: int
    slug: str
    title: str
    short_description: str
    description: str
    address: str
    color: str
    category: str
    difficulty: str
    reward_xp: int
    latitude: float
    longitude: float
    activities: list[LocationActivityRead]

    model_config = ConfigDict(from_attributes=True)


class TaskRead(BaseModel):
    id: int
    slug: str
    title: str
    subtitle: str
    difficulty: str
    reward_xp: int
    reward_text: str
    time_left: str
    icon: str
    progress: float
    progress_value: int
    progress_target: int
    progress_text: str
    status: str
    location_id: int | None = None


class AchievementRead(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    condition_text: str
    icon: str
    tone: str
    earned: bool


class ProfileRead(BaseModel):
    user: UserRead
    active_days: int
    total_steps: int
    total_distance_km: float
    discovered_percent: int
    districts_explored: int
    locations_discovered: int
    secrets_found: int
    unlocked_achievements: int
    total_achievements: int
