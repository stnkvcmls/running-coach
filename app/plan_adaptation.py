"""Daily readiness-driven workout adaptation (P1-1).

Closes the loop between the readiness score computed in ``training_load`` and
the static ``TrainingPlanDay`` prescription: a hard day paired with low
readiness is downgraded, and an easy day paired with excellent readiness gets
a small upgrade nudge. Purely rule-based (readiness bands x workout type) —
no AI involved.
"""

from __future__ import annotations

from app.models import DailyCheckin, TrainingPlanDay
from app.schemas import PlanAdaptationSuggestion, TrainingReadiness

HARD_WORKOUT_TYPES = {"tempo", "interval", "long"}
EASY_WORKOUT_TYPES = {"easy"}

# Downgrade an easy day's target distance to this fraction when readiness is Fair.
_DOWNGRADE_DISTANCE_FACTOR = 0.6
# Upgrade an easy day's target distance by this fraction when readiness is Excellent.
_UPGRADE_DISTANCE_FACTOR = 0.15
_UPGRADE_DISTANCE_CAP_M = 2000.0

# Check-in taps are 1 (worst) - 5 (best); at/below these thresholds the athlete
# is reporting they feel bad enough to override a merely-Fair/Good composite
# score, the same way a "legs dead" report should downgrade a hard day.
_CHECKIN_SORENESS_OVERRIDE = 2
_CHECKIN_LOW_OVERRIDE = 2


def _checkin_feels_bad(checkin: DailyCheckin | None) -> bool:
    """Whether today's check-in alone warrants easing off a hard session."""
    if checkin is None:
        return False
    if checkin.soreness is not None and checkin.soreness <= _CHECKIN_SORENESS_OVERRIDE:
        return True
    if checkin.energy is not None and checkin.energy <= _CHECKIN_LOW_OVERRIDE:
        return True
    if checkin.mood is not None and checkin.mood <= _CHECKIN_LOW_OVERRIDE:
        return True
    return False


def suggest_adaptation(
    plan_day: TrainingPlanDay | None,
    readiness: TrainingReadiness | None,
    checkin: DailyCheckin | None = None,
) -> PlanAdaptationSuggestion | None:
    """Propose a rule-based swap for today's plan day, or None if no change is warranted."""
    if plan_day is None or readiness is None:
        return None

    workout_type = plan_day.workout_type

    if workout_type in HARD_WORKOUT_TYPES:
        if readiness.score > 50 and _checkin_feels_bad(checkin):
            suggested_distance = (
                round(plan_day.target_distance_m * _DOWNGRADE_DISTANCE_FACTOR)
                if plan_day.target_distance_m
                else None
            )
            return PlanAdaptationSuggestion(
                plan_day_id=plan_day.id,
                direction="downgrade",
                current_workout_type=workout_type,
                suggested_workout_type="easy",
                current_target_distance_m=plan_day.target_distance_m,
                suggested_target_distance_m=suggested_distance,
                reason=(
                    "Your check-in says you're not feeling it today — consider "
                    f"swapping today's {workout_type} for an easy effort."
                ),
                readiness_score=readiness.score,
            )
        if readiness.score <= 30:
            return PlanAdaptationSuggestion(
                plan_day_id=plan_day.id,
                direction="downgrade",
                current_workout_type=workout_type,
                suggested_workout_type="rest",
                current_target_distance_m=plan_day.target_distance_m,
                suggested_target_distance_m=None,
                reason=(
                    f"Readiness is Low today ({readiness.score}/100) — consider "
                    f"resting instead of today's {workout_type} session."
                ),
                readiness_score=readiness.score,
            )
        if readiness.score <= 50:
            suggested_distance = (
                round(plan_day.target_distance_m * _DOWNGRADE_DISTANCE_FACTOR)
                if plan_day.target_distance_m
                else None
            )
            return PlanAdaptationSuggestion(
                plan_day_id=plan_day.id,
                direction="downgrade",
                current_workout_type=workout_type,
                suggested_workout_type="easy",
                current_target_distance_m=plan_day.target_distance_m,
                suggested_target_distance_m=suggested_distance,
                reason=(
                    f"Readiness is Fair today ({readiness.score}/100) — consider "
                    f"swapping today's {workout_type} for an easy effort."
                ),
                readiness_score=readiness.score,
            )
        return None

    if workout_type in EASY_WORKOUT_TYPES and readiness.score >= 86:
        suggested_distance = (
            min(
                plan_day.target_distance_m * (1 + _UPGRADE_DISTANCE_FACTOR),
                plan_day.target_distance_m + _UPGRADE_DISTANCE_CAP_M,
            )
            if plan_day.target_distance_m
            else None
        )
        suggested_distance = round(suggested_distance) if suggested_distance else None
        return PlanAdaptationSuggestion(
            plan_day_id=plan_day.id,
            direction="upgrade",
            current_workout_type=workout_type,
            suggested_workout_type="easy",
            current_target_distance_m=plan_day.target_distance_m,
            suggested_target_distance_m=suggested_distance,
            reason=(
                f"Readiness is Excellent today ({readiness.score}/100) — you're "
                "primed. Feel free to add a few strides or extend today's easy run."
            ),
            readiness_score=readiness.score,
        )

    return None
