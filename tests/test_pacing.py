"""Tests for app.pacing — race-day split-plan generation."""
from __future__ import annotations

import pytest

from app.pacing import (
    PacingPlan,
    PacingSplit,
    _split_time,
    generate_pacing_strategy,
)


# ---------------------------------------------------------------------------
# _split_time helper
# ---------------------------------------------------------------------------

def test_split_time_1km_at_5min():
    # 5 min/km over 1000 m = 300 s
    assert _split_time(5.0, 1000.0) == pytest.approx(300.0)


def test_split_time_half_km():
    # 4 min/km over 500 m = 120 s
    assert _split_time(4.0, 500.0) == pytest.approx(120.0)


# ---------------------------------------------------------------------------
# generate_pacing_strategy — validation
# ---------------------------------------------------------------------------

def test_invalid_zero_distance_raises():
    with pytest.raises(ValueError, match="positive"):
        generate_pacing_strategy(0, 3600)


def test_invalid_zero_time_raises():
    with pytest.raises(ValueError, match="positive"):
        generate_pacing_strategy(10000, 0)


def test_invalid_negative_distance_raises():
    with pytest.raises(ValueError):
        generate_pacing_strategy(-5000, 1800)


# ---------------------------------------------------------------------------
# Even splits — 10 K
# ---------------------------------------------------------------------------

def test_even_10k_split_count():
    plan = generate_pacing_strategy(10000, 2400)
    assert len(plan.splits) == 10  # exactly 10 km, no remainder


def test_even_10k_all_same_pace():
    plan = generate_pacing_strategy(10000, 2400)
    paces = [s.target_pace_min_km for s in plan.splits]
    assert all(p == pytest.approx(paces[0]) for p in paces)


def test_even_10k_cumulative_time_matches_target():
    plan = generate_pacing_strategy(10000, 2400)
    assert plan.splits[-1].cumulative_time_sec == pytest.approx(2400.0, abs=1.0)


def test_even_10k_target_pace():
    # 2400s / 10000m * 1000 / 60 = 4.0 min/km
    plan = generate_pacing_strategy(10000, 2400)
    assert plan.target_pace_min_km == pytest.approx(4.0, rel=1e-3)


def test_even_split_numbers_sequential():
    plan = generate_pacing_strategy(10000, 2400)
    for i, s in enumerate(plan.splits):
        assert s.split_number == i + 1


def test_even_split_distances_correct():
    plan = generate_pacing_strategy(10000, 2400)
    for s in plan.splits:
        assert s.split_distance_m == pytest.approx(1000.0)


# ---------------------------------------------------------------------------
# Even splits — half marathon (has remainder split)
# ---------------------------------------------------------------------------

def test_half_marathon_split_count():
    # 21097.5 m → 21 full km + 97.5 m remainder
    plan = generate_pacing_strategy(21097.5, 6300)
    assert len(plan.splits) == 22


def test_half_marathon_last_split_is_remainder():
    plan = generate_pacing_strategy(21097.5, 6300)
    assert plan.splits[-1].split_distance_m == pytest.approx(97.5, abs=1.0)


def test_half_marathon_cumulative_distance():
    plan = generate_pacing_strategy(21097.5, 6300)
    assert plan.splits[-1].cumulative_distance_m == pytest.approx(21097.5, abs=1.0)


def test_half_marathon_cumulative_time_matches_target():
    plan = generate_pacing_strategy(21097.5, 6300)
    assert plan.splits[-1].cumulative_time_sec == pytest.approx(6300.0, abs=2.0)


# ---------------------------------------------------------------------------
# Negative split strategy
# ---------------------------------------------------------------------------

def test_negative_split_10k_count():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    assert len(plan.splits) == 10


def test_negative_split_first_half_slower():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    first_half = [s.target_pace_min_km for s in plan.splits[:5]]
    second_half = [s.target_pace_min_km for s in plan.splits[5:]]
    assert all(f > s for f, s in zip(first_half, second_half))


def test_negative_split_total_time_preserved():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    assert plan.splits[-1].cumulative_time_sec == pytest.approx(2400.0, abs=1.0)


def test_negative_split_first_pace_is_2pct_slower():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    even_pace = 4.0  # 2400/10000 * 1000/60
    assert plan.splits[0].target_pace_min_km == pytest.approx(even_pace * 1.02, rel=1e-3)


def test_negative_split_second_pace_is_2pct_faster():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    even_pace = 4.0
    assert plan.splits[-1].target_pace_min_km == pytest.approx(even_pace * 0.98, rel=1e-3)


# ---------------------------------------------------------------------------
# Mile splits
# ---------------------------------------------------------------------------

_MILE_M = 1609.344

def test_mile_split_unit():
    plan = generate_pacing_strategy(42195, 14400, split_unit="mile")
    assert plan.split_unit == "mile"
    assert plan.split_distance_m == pytest.approx(_MILE_M, rel=1e-4)


def test_mile_split_distances():
    plan = generate_pacing_strategy(42195, 14400, split_unit="mile")
    full_splits = [s for s in plan.splits if s.split_distance_m > _MILE_M * 0.9]
    for s in full_splits:
        assert s.split_distance_m == pytest.approx(_MILE_M, rel=1e-4)


def test_mile_split_cumulative_time():
    plan = generate_pacing_strategy(42195, 14400, split_unit="mile")
    assert plan.splits[-1].cumulative_time_sec == pytest.approx(14400.0, abs=5.0)


# ---------------------------------------------------------------------------
# Return type and metadata
# ---------------------------------------------------------------------------

def test_returns_pacing_plan():
    plan = generate_pacing_strategy(5000, 1500)
    assert isinstance(plan, PacingPlan)


def test_splits_are_pacing_split_instances():
    plan = generate_pacing_strategy(5000, 1500)
    for s in plan.splits:
        assert isinstance(s, PacingSplit)


def test_strategy_stored_on_plan():
    plan = generate_pacing_strategy(10000, 2400, strategy="negative_split")
    assert plan.strategy == "negative_split"


def test_source_default():
    plan = generate_pacing_strategy(10000, 2400)
    assert plan.source == "goal"


def test_source_custom():
    plan = generate_pacing_strategy(10000, 2400, source="predicted")
    assert plan.source == "predicted"


def test_predicted_time_stored():
    plan = generate_pacing_strategy(10000, 2400, predicted_time_sec=2350.0)
    assert plan.predicted_time_sec == pytest.approx(2350.0)


def test_predicted_time_none_by_default():
    plan = generate_pacing_strategy(10000, 2400)
    assert plan.predicted_time_sec is None


def test_distance_stored_on_plan():
    plan = generate_pacing_strategy(5000, 1500)
    assert plan.distance_m == pytest.approx(5000.0)


def test_target_time_stored():
    plan = generate_pacing_strategy(5000, 1500)
    assert plan.target_time_sec == pytest.approx(1500.0)


# ---------------------------------------------------------------------------
# translate_race_pacing (workout_translator)
# ---------------------------------------------------------------------------

def test_translate_race_pacing_structure():
    from datetime import date
    from app.workout_translator import translate_race_pacing

    plan = generate_pacing_strategy(10000, 2400)
    payload = translate_race_pacing("Test 10K", date(2026, 10, 11), plan.splits)

    assert "Race Pacing" in payload["workoutName"]
    assert payload["sportType"]["sportTypeKey"] == "running"
    steps = payload["workoutSegments"][0]["workoutSteps"]
    assert len(steps) == 10


def test_translate_race_pacing_pace_targets():
    from datetime import date
    from app.workout_translator import translate_race_pacing

    plan = generate_pacing_strategy(10000, 2400)
    payload = translate_race_pacing("Test 10K", date(2026, 10, 11), plan.splits)

    steps = payload["workoutSegments"][0]["workoutSteps"]
    for step in steps:
        assert step["targetType"]["workoutTargetTypeKey"] == "pace.zone"
        assert step["targetValueOne"] > step["targetValueTwo"]


def test_translate_race_pacing_estimated_duration():
    from datetime import date
    from app.workout_translator import translate_race_pacing

    plan = generate_pacing_strategy(10000, 2400)
    payload = translate_race_pacing("Test 10K", date(2026, 10, 11), plan.splits)

    assert payload["estimatedDurationInSecs"] == pytest.approx(2400, abs=2)
    assert payload["estimatedDistanceInMeters"] == pytest.approx(10000.0, abs=1)
