"""Helpers for resolving the active TrainingPlanDay for a calendar date."""
from datetime import date

from sqlalchemy.orm import Session

from app.models import TrainingPlan, TrainingPlanDay


def get_active_plan_day(db: Session, user_id: int, day: date) -> TrainingPlanDay | None:
    """The plan day for `day` from the most recently generated plan that covers it."""
    return (
        db.query(TrainingPlanDay)
        .join(TrainingPlan, TrainingPlan.id == TrainingPlanDay.plan_id)
        .filter(
            TrainingPlan.user_id == user_id,
            TrainingPlanDay.user_id == user_id,
            TrainingPlanDay.day_date == day,
        )
        .order_by(
            TrainingPlan.generated_at.desc(),
            TrainingPlan.id.desc(),
            TrainingPlanDay.id.desc(),
        )
        .first()
    )
