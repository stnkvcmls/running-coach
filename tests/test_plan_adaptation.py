"""Tests for readiness-driven plan day adaptation (P1-1)."""

from app.models import DailyCheckin, TrainingPlanDay
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


def _checkin(*, soreness=None, energy=None, mood=None):
    return DailyCheckin(soreness=soreness, energy=energy, mood=mood)


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


# --- Check-in override ---

def test_checkin_feels_bad_overrides_good_readiness_on_hard_day():
    day = _day(workout_type="tempo", target_distance_m=10000.0)
    # Readiness alone ("Good", 70) would not trigger any suggestion.
    assert suggest_adaptation(day, _readiness(70, "Good")) is None
    suggestion = suggest_adaptation(day, _readiness(70, "Good"), _checkin(soreness=1))
    assert suggestion is not None
    assert suggestion.direction == "downgrade"
    assert suggestion.suggested_workout_type == "easy"
    assert suggestion.suggested_target_distance_m == 6000.0


def test_checkin_low_energy_also_overrides():
    day = _day(workout_type="interval")
    suggestion = suggest_adaptation(day, _readiness(80, "Very Good"), _checkin(energy=2))
    assert suggestion is not None
    assert suggestion.direction == "downgrade"


def test_checkin_low_mood_also_overrides():
    day = _day(workout_type="long")
    suggestion = suggest_adaptation(day, _readiness(80, "Very Good"), _checkin(mood=1))
    assert suggestion is not None
    assert suggestion.direction == "downgrade"


def test_checkin_feeling_fine_does_not_override_good_readiness():
    day = _day(workout_type="tempo")
    assert suggest_adaptation(day, _readiness(70, "Good"), _checkin(soreness=5, energy=5, mood=5)) is None


def test_checkin_override_does_not_apply_to_easy_days():
    day = _day(workout_type="easy", target_distance_m=8000.0)
    assert suggest_adaptation(day, _readiness(70, "Good"), _checkin(soreness=1)) is None


def test_checkin_does_not_downgrade_already_low_readiness_twice():
    # Low readiness already downgrades to rest; the check-in doesn't change that outcome.
    day = _day(workout_type="tempo")
    suggestion = suggest_adaptation(day, _readiness(25, "Low"), _checkin(soreness=1))
    assert suggestion is not None
    assert suggestion.suggested_workout_type == "rest"
