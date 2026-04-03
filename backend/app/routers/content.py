from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Achievement, Location, Task, User, UserAchievement, UserTaskProgress
from ..schemas import AchievementRead, LocationRead, TaskRead

router = APIRouter(tags=["content"])


def build_progress_text(value: int, target: int, unit: str) -> str:
    return f"Прогресс: {value} / {target} {unit}".strip()


@router.get("/locations", response_model=list[LocationRead])
def list_locations(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Location]:
    statement = select(Location).options(selectinload(Location.activities)).order_by(Location.id)
    return list(db.scalars(statement).all())


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskRead]:
    statement = (
        select(Task, UserTaskProgress)
        .outerjoin(
            UserTaskProgress,
            (UserTaskProgress.task_id == Task.id) & (UserTaskProgress.user_id == current_user.id),
        )
        .order_by(Task.sort_order, Task.id)
    )
    rows = db.execute(statement).all()

    tasks: list[TaskRead] = []
    for task, progress in rows:
        value = progress.progress_value if progress else 0
        target = progress.progress_target if progress else 1
        unit = progress.progress_unit if progress else ""
        status = progress.status if progress else "active"
        progress_ratio = min(value / target, 1) if target else 0
        tasks.append(
            TaskRead(
                id=task.id,
                slug=task.slug,
                title=task.title,
                subtitle=task.subtitle,
                difficulty=task.difficulty,
                reward_xp=task.reward_xp,
                reward_text=task.reward_text,
                time_left=task.time_left,
                icon=task.icon,
                progress=progress_ratio,
                progress_value=value,
                progress_target=target,
                progress_text=build_progress_text(value, target, unit),
                status=status,
                location_id=task.location_id,
            )
        )
    return tasks


@router.get("/achievements", response_model=list[AchievementRead])
def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AchievementRead]:
    statement = (
        select(Achievement, UserAchievement)
        .outerjoin(
            UserAchievement,
            (UserAchievement.achievement_id == Achievement.id)
            & (UserAchievement.user_id == current_user.id),
        )
        .order_by(Achievement.sort_order, Achievement.id)
    )
    rows = db.execute(statement).all()
    return [
        AchievementRead(
            id=achievement.id,
            slug=achievement.slug,
            title=achievement.title,
            description=achievement.description,
            condition_text=achievement.condition_text,
            icon=achievement.icon,
            tone=achievement.tone,
            earned=progress.earned if progress else False,
        )
        for achievement, progress in rows
    ]
