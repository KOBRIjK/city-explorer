from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
from .models import (
    Achievement,
    Location,
    LocationActivity,
    Task,
    User,
    UserAchievement,
    UserTaskProgress,
)


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)) is not None:
        return

    club = Location(
        slug="rukh-fight-club",
        title="Клуб единоборств «РУХ»",
        short_description="Бокс, ММА, карате, самбо и другие единоборства в центре Казани.",
        description=(
            "«РУХ» — профессиональная площадка для занятий боксом, ММА, карате, "
            "самбо и другими единоборствами в Казани. Здесь опытные тренеры помогут "
            "сделать первый шаг или покорить новые спортивные вершины."
        ),
        address="г. Казань, ул. Павлюхина, 108Б к2, вход через внутренний двор",
        color="#00D67D",
        category="sport",
        difficulty="easy",
        reward_xp=250,
        latitude=55.7685806,
        longitude=49.1418968,
    )
    club.activities = [
        LocationActivity(title="Групповые тренировки", sort_order=1),
        LocationActivity(title="Персональные тренировки", sort_order=2),
        LocationActivity(title="Кроссфит", sort_order=3),
        LocationActivity(title="Сауна после занятий", sort_order=4),
    ]

    arena = Location(
        slug="rukh-cyberarena",
        title="Киберарена «РУХ»",
        short_description="Киберспорт, мощные ПК, турниры и командные тренировки.",
        description=(
            "«РУХ» — пространство для тех, кто мыслит стратегически и жаждет "
            "виртуальных побед. Профессиональное оборудование, мощные ПК и атмосфера "
            "киберспорта ждут тебя на втором этаже комплекса."
        ),
        address="г. Казань, ул. Павлюхина, 108Б к2, 2 этаж",
        color="#FFB020",
        category="cybersport",
        difficulty="medium",
        reward_xp=180,
        latitude=55.7686706,
        longitude=49.1420968,
    )
    arena.activities = [
        LocationActivity(title="Игры на мощных ПК", sort_order=1),
        LocationActivity(title="Любительские и профессиональные турниры", sort_order=2),
        LocationActivity(title="Аренда залов для командной тренировки", sort_order=3),
        LocationActivity(title="Стриминг", sort_order=4),
    ]

    tasks = [
        Task(
            slug="first-step",
            title="Первопроходец",
            subtitle="Запишись на пробную тренировку и проведи первую полноценную тренировку.",
            difficulty="easy",
            reward_xp=100,
            reward_text="10% скидка на оформление абонемента",
            time_left="7 дней",
            icon="rocket",
            sort_order=1,
            location=club,
        ),
        Task(
            slug="spirit-power",
            title="Сила духа",
            subtitle="Посети одну тренировку в любом направлении в клубе «РУХ».",
            difficulty="easy",
            reward_xp=250,
            reward_text="5% скидка на индивидуальную тренировку",
            time_left="5 дней",
            icon="barbell",
            sort_order=2,
            location=club,
        ),
        Task(
            slug="endurance-test",
            title="Испытание на прочность",
            subtitle="Посети 3 групповые тренировки за 1 неделю в клубе «РУХ».",
            difficulty="medium",
            reward_xp=350,
            reward_text="5% скидка на индивидуальную тренировку",
            time_left="1 неделя",
            icon="flame",
            sort_order=3,
            location=club,
        ),
        Task(
            slug="sports-brotherhood",
            title="Спортивное братство",
            subtitle="Приходи на тренировку с другом в любом направлении клуба «РУХ».",
            difficulty="medium",
            reward_xp=500,
            reward_text="Бонус к опыту без дополнительной скидки",
            time_left="10 дней",
            icon="people",
            sort_order=4,
            location=club,
        ),
        Task(
            slug="resident",
            title="Постоялец",
            subtitle="Посещай тренировки в центре «РУХ» в течение 1 месяца.",
            difficulty="hard",
            reward_xp=600,
            reward_text="10% скидка на спортивное питание",
            time_left="30 дней",
            icon="trophy",
            sort_order=5,
            location=club,
        ),
    ]

    achievements = [
        Achievement(
            slug="pathfinder",
            title="Первопроходец",
            description="Пробная тренировка в «РУХ».",
            condition_text="Сходить на пробную тренировку в «РУХ».",
            icon="search",
            tone="green",
            sort_order=1,
        ),
        Achievement(
            slug="consistent-user",
            title="Постоянный пользователь",
            description="Открывай приложение 7 дней подряд.",
            condition_text="Заходить в приложение «Открой город» 7 дней подряд.",
            icon="phone",
            tone="dark",
            sort_order=2,
        ),
        Achievement(
            slug="rukh-legend",
            title="Легенда «РУХа»",
            description="Посети 10 тренировок в центре «РУХ».",
            condition_text="Прийти на 10 тренировок в центр «РУХ».",
            icon="trophy",
            tone="dark",
            sort_order=3,
        ),
    ]

    demo_user = User(
        email="demo@cityexplorer.local",
        full_name="Ильнар Ибатуллин",
        city="Казань",
        hashed_password=hash_password("demo12345"),
        level=12,
        xp=3250,
        xp_next_level=5000,
        active_days=7,
        total_steps=847000,
        total_distance_km=342,
        discovered_percent=67,
        districts_explored=8,
        locations_discovered=2,
        secrets_found=3,
    )

    db.add_all([club, arena, demo_user, *tasks, *achievements])
    db.flush()

    progress_items = [
        UserTaskProgress(
            user_id=demo_user.id,
            task_id=tasks[0].id,
            progress_value=1,
            progress_target=1,
            progress_unit="тренировка",
            status="completed",
        ),
        UserTaskProgress(
            user_id=demo_user.id,
            task_id=tasks[1].id,
            progress_value=1,
            progress_target=1,
            progress_unit="тренировка",
            status="completed",
        ),
        UserTaskProgress(
            user_id=demo_user.id,
            task_id=tasks[2].id,
            progress_value=2,
            progress_target=3,
            progress_unit="тренировки",
            status="active",
        ),
        UserTaskProgress(
            user_id=demo_user.id,
            task_id=tasks[3].id,
            progress_value=0,
            progress_target=1,
            progress_unit="визит",
            status="active",
        ),
        UserTaskProgress(
            user_id=demo_user.id,
            task_id=tasks[4].id,
            progress_value=10,
            progress_target=30,
            progress_unit="дней",
            status="active",
        ),
    ]

    achievement_progress = [
        UserAchievement(user_id=demo_user.id, achievement_id=achievements[0].id, earned=True),
        UserAchievement(user_id=demo_user.id, achievement_id=achievements[1].id, earned=True),
        UserAchievement(user_id=demo_user.id, achievement_id=achievements[2].id, earned=False),
    ]

    db.add_all(progress_items + achievement_progress)
    db.commit()
