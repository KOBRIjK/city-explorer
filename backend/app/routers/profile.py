from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Achievement, User, UserAchievement
from ..schemas import ProfileRead, UserRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileRead)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileRead:
    unlocked_achievements = db.scalar(
        select(func.count(UserAchievement.id)).where(
            UserAchievement.user_id == current_user.id,
            UserAchievement.earned.is_(True),
        )
    ) or 0
    total_achievements = db.scalar(select(func.count(Achievement.id))) or 0

    return ProfileRead(
        user=UserRead.model_validate(current_user),
        active_days=current_user.active_days,
        total_steps=current_user.total_steps,
        total_distance_km=current_user.total_distance_km,
        discovered_percent=current_user.discovered_percent,
        districts_explored=current_user.districts_explored,
        locations_discovered=current_user.locations_discovered,
        secrets_found=current_user.secrets_found,
        unlocked_achievements=unlocked_achievements,
        total_achievements=total_achievements,
    )
