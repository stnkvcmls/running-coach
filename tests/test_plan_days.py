"""Tests for app.plan_days.get_active_plan_day and /today active-plan scoping."""
from datetime import date, datetime, timezone

from app.models import TrainingPlan, TrainingPlanDay
from app.plan_days import get_active_plan_day


def _seed_plan_with_day(
    db,
    *,
    user_id: int,
    generated_at: datetime,
    day_date: date,
    workout_type: str,
) -> TrainingPlanDay:
    plan = TrainingPlan(
        user_id=user_id,
        generated_at=generated_at,
        week_start=day_date,
        plan_weeks=4,
    )
    db.add(plan)
    db.flush()
    day = TrainingPlanDay(
        user_id=user_id,
        plan_id=plan.id,
        day_date=day_date,
        day_of_week=day_date.strftime("%A"),
        week_number=1,
        workout_type=workout_type,
    )
    db.add(day)
    db.commit()
    db.refresh(day)
    return day


def test_get_active_plan_day_prefers_newer_plan(db):
    target = date(2026, 6, 24)
    _seed_plan_with_day(
        db,
        user_id=1,
        generated_at=datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="easy",
    )
    new_day = _seed_plan_with_day(
        db,
        user_id=1,
        generated_at=datetime(2026, 6, 8, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="rest",
    )

    active = get_active_plan_day(db, 1, target)
    assert active is not None
    assert active.id == new_day.id
    assert active.workout_type == "rest"


def test_today_endpoint_returns_newer_plan_day_id(client, db):
    target = date(2026, 6, 24)
    _seed_plan_with_day(
        db,
        user_id=1,
        generated_at=datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="easy",
    )
    new_day = _seed_plan_with_day(
        db,
        user_id=1,
        generated_at=datetime(2026, 6, 8, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="tempo",
    )

    resp = client.get(f"/api/v1/today?date={target.isoformat()}")
    assert resp.status_code == 200
    assert resp.json()["plan_day_id"] == new_day.id


def test_get_active_plan_day_does_not_leak_other_users_newer_plan(client, db):
    target = date(2026, 6, 24)
    user1_day = _seed_plan_with_day(
        db,
        user_id=1,
        generated_at=datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="easy",
    )
    _seed_plan_with_day(
        db,
        user_id=2,
        generated_at=datetime(2026, 6, 15, 8, 0, tzinfo=timezone.utc),
        day_date=target,
        workout_type="interval",
    )

    active = get_active_plan_day(db, 1, target)
    assert active is not None
    assert active.id == user1_day.id
    assert active.workout_type == "easy"

    resp = client.get(f"/api/v1/today?date={target.isoformat()}")
    assert resp.status_code == 200
    assert resp.json()["plan_day_id"] == user1_day.id
    assert get_active_plan_day(db, 3, target) is None
