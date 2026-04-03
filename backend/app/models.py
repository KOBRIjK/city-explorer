from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(120), default="Казань")
    hashed_password: Mapped[str] = mapped_column(String(255))

    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    xp_next_level: Mapped[int] = mapped_column(Integer, default=1000)
    active_days: Mapped[int] = mapped_column(Integer, default=1)
    total_steps: Mapped[int] = mapped_column(Integer, default=0)
    total_distance_km: Mapped[float] = mapped_column(Float, default=0)
    discovered_percent: Mapped[int] = mapped_column(Integer, default=0)
    districts_explored: Mapped[int] = mapped_column(Integer, default=0)
    locations_discovered: Mapped[int] = mapped_column(Integer, default=0)
    secrets_found: Mapped[int] = mapped_column(Integer, default=0)

    task_progress: Mapped[list["UserTaskProgress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    achievement_progress: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    short_description: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(2000))
    address: Mapped[str] = mapped_column(String(255))
    color: Mapped[str] = mapped_column(String(20), default="#00D67D")
    category: Mapped[str] = mapped_column(String(80), default="partner")
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    reward_xp: Mapped[int] = mapped_column(Integer, default=100)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    activities: Mapped[list["LocationActivity"]] = relationship(
        back_populates="location",
        cascade="all, delete-orphan",
        order_by="LocationActivity.sort_order",
    )
    tasks: Mapped[list["Task"]] = relationship(back_populates="location")


class LocationActivity(Base):
    __tablename__ = "location_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    location: Mapped[Location] = relationship(back_populates="activities")


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    subtitle: Mapped[str] = mapped_column(String(500))
    difficulty: Mapped[str] = mapped_column(String(20))
    reward_xp: Mapped[int] = mapped_column(Integer)
    reward_text: Mapped[str] = mapped_column(String(255))
    time_left: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(50), default="flash")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)

    location: Mapped[Location | None] = relationship(back_populates="tasks")
    user_progress: Mapped[list["UserTaskProgress"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
    )


class UserTaskProgress(Base, TimestampMixin):
    __tablename__ = "user_task_progress"
    __table_args__ = (UniqueConstraint("user_id", "task_id", name="uq_user_task"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    progress_value: Mapped[int] = mapped_column(Integer, default=0)
    progress_target: Mapped[int] = mapped_column(Integer, default=1)
    progress_unit: Mapped[str] = mapped_column(String(50), default="visits")
    status: Mapped[str] = mapped_column(String(20), default="active")

    user: Mapped[User] = relationship(back_populates="task_progress")
    task: Mapped[Task] = relationship(back_populates="user_progress")


class Achievement(Base, TimestampMixin):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(500))
    condition_text: Mapped[str] = mapped_column(String(500))
    icon: Mapped[str] = mapped_column(String(50), default="trophy")
    tone: Mapped[str] = mapped_column(String(20), default="dark")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    user_progress: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement",
        cascade="all, delete-orphan",
    )


class UserAchievement(Base, TimestampMixin):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"),
        index=True,
    )
    earned: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="achievement_progress")
    achievement: Mapped[Achievement] = relationship(back_populates="user_progress")
