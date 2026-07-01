"""Tests for readiness-driven plan day adaptation (P1-1)."""

from app.models import TrainingPlanDay
from app.plan_adaptation import suggest_adaptation
from app.schemas import TrainingReadiness


def _day(workout_type="tempo", target_distance_m=10000.0, day_id=1):
    return TrainingPlanDay(
        id=day_id,
        plan_id=1,
        day_date=None,
        day_of_week="Monday",
        week_number=1,
        workout_type=workout_type,
        target_distance_m=target_distance_m,
    )


def _readiness(score, label="Fair"):
    return TrainingReadiness(score=score, label=label)


def test_no_suggestion_without_plan_day():
    assert suggest_adaptation(None, _readiness(20)) is None


def test_no_suggestion_without_readiness():
    assert suggest_adaptation(_day(), None) is None


def test_hard_day_low_readiness_downgrades_to_rest():
    day = _day(workout_type="interval", target_distance_m=8000.0)
    suggestion = suggest_adaptation(day, _readiness(25, "Low"))
    assert suggestion is not None
    assert suggestion.direction == "downgrade"
    assert suggestion.plan_day_id == day.id
    assert suggestion.current_workout_type == "interval"
    assert suggestion.suggested_workout_type == "rest"
    assert suggestion.suggested_target_distance_m is None
    assert "Low" in suggestion.reason


def test_hard_day_fair_readiness_downgrades_to_easy_with_reduced_distance():
    day = _day(workout_type="tempo", target_distance_m=10000.0)
    suggestion = suggest_adaptation(day, _readiness(45, "Fair"))
    assert suggestion is not None
    assert suggestion.direction == "downgrade"
    assert suggestion.suggested_workout_type == "easy"
    assert suggestion.suggested_target_distance_m == 6000.0
    assert suggestion.current_target_distance_m == 10000.0


def test_hard_day_fair_readiness_without_target_distance():
    day = _day(workout_type="long", target_distance_m=None)
    suggestion = suggest_adaptation(day, _readiness(40, "Fair"))
    assert suggestion is not None
    assert suggestion.suggested_target_distance_m is None


def test_hard_day_good_readiness_no_suggestion():
    day = _day(workout_type="tempo")
    assert suggest_adaptation(day, _readiness(51, "Good")) is None


def test_easy_day_excellent_readiness_upgrades():
    day = _day(workout_type="easy", target_distance_m=8000.0)
    suggestion = suggest_adaptation(day, _readiness(90, "Excellent"))
    assert suggestion is not None
    assert suggestion.direction == "upgrade"
    assert suggestion.suggested_workout_type == "easy"
    assert suggestion.suggested_target_distance_m == 9200.0  # +15%, under the 2km cap


def test_easy_day_upgrade_distance_capped():
    day = _day(workout_type="easy", target_distance_m=20000.0)
    suggestion = suggest_adaptation(day, _readiness(90, "Excellent"))
    assert suggestion is not None
    assert suggestion.suggested_target_distance_m == 22000.0  # capped at +2km, not +15%


def test_easy_day_good_readiness_no_suggestion():
    day = _day(workout_type="easy")
    assert suggest_adaptation(day, _readiness(60, "Good")) is None


def test_rest_day_never_suggests():
    day = _day(workout_type="rest")
    assert suggest_adaptation(day, _readiness(20, "Low")) is None
    assert suggest_adaptation(day, _readiness(95, "Excellent")) is None


def test_strength_and_cross_days_never_suggest():
    assert suggest_adaptation(_day(workout_type="strength"), _readiness(95)) is None
    assert suggest_adaptation(_day(workout_type="cross"), _readiness(95)) is None
