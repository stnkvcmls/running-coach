"""Tests for app.adherence: compute_adherence and format_adherence_context."""

import json

import pytest

from app import adherence as adh
from app.schemas import WorkoutAdherence


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_steps(raw_list):
    """Parse a raw list of step dicts directly."""
    raw = json.dumps({"workoutSteps": raw_list})
    return adh.parse_workout_steps(raw)


class FakeActivity:
    def __init__(self, distance_m=None, avg_pace_min_km=None, laps_json=None, splits_json=None):
        self.distance_m = distance_m
        self.avg_pace_min_km = avg_pace_min_km
        self.laps_json = laps_json
        self.splits_json = splits_json


# ---------------------------------------------------------------------------
# _flatten_steps
# ---------------------------------------------------------------------------

def test_flatten_no_repeats():
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    flat = adh._flatten_steps(steps)
    assert len(flat) == 2


def test_flatten_repeat_block():
    """4 reps of (interval + rest) → 8 flat steps."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 400},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 60},
        ]},
    ])
    flat = adh._flatten_steps(steps)
    assert len(flat) == 8
    assert flat[0].step_type == "interval"
    assert flat[1].step_type == "rest"
    assert flat[6].step_type == "interval"


# ---------------------------------------------------------------------------
# _parse_pace_display / _parse_single_pace
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pace_str,expected", [
    ("4:30", 270.0),
    ("5:00", 300.0),
    ("3:59", 239.0),
])
def test_parse_single_pace(pace_str, expected):
    assert adh._parse_single_pace(pace_str) == expected


def test_parse_pace_display_simple():
    assert adh._parse_pace_display("4:30/km") == 270.0


def test_parse_pace_display_range_midpoint():
    # "4:20 - 4:40/km" → midpoint of 260 and 280 = 270
    result = adh._parse_pace_display("4:20 - 4:40/km")
    assert result == pytest.approx(270.0)


def test_parse_pace_display_no_km():
    assert adh._parse_pace_display("4:30") is None
    assert adh._parse_pace_display("") is None
    assert adh._parse_pace_display(None) is None


# ---------------------------------------------------------------------------
# compute_adherence
# ---------------------------------------------------------------------------

def test_compute_adherence_returns_none_for_empty_steps():
    activity = FakeActivity(distance_m=5000.0, avg_pace_min_km=5.0)
    assert adh.compute_adherence(activity, []) is None


def test_compute_adherence_distance_only():
    """Workout with only a distance step and no pace target."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=5000.0)
    result = adh.compute_adherence(activity, steps)

    assert result is not None
    assert result.planned_distance_m == 5000.0
    assert result.actual_distance_m == 5000.0
    assert result.distance_pct == 100.0
    assert result.adherence_score == 100.0
    assert result.planned_pace_display is None
    assert result.planned_intervals == 1


def test_compute_adherence_partial_distance():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 10000},
    ])
    activity = FakeActivity(distance_m=8000.0)
    result = adh.compute_adherence(activity, steps)

    assert result.distance_pct == pytest.approx(80.0)
    assert result.adherence_score < 90


def test_compute_adherence_distance_pct_capped_at_100():
    """Running more than planned should not exceed 100%."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=6000.0)
    result = adh.compute_adherence(activity, steps)
    assert result.distance_pct == 100.0


def test_compute_adherence_with_pace_target():
    """Pace on-target gives high adherence score."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "active", "endCondition": "distance", "endConditionValue": 5000,
         "targetType": "pace", "targetValueOne": 1000 / 270},  # 4:30/km
        {"stepType": "cool_down", "endCondition": "distance", "endConditionValue": 1000},
    ])
    activity = FakeActivity(distance_m=7000.0, avg_pace_min_km=4.5)  # 4:30/km exactly
    result = adh.compute_adherence(activity, steps)

    assert result.planned_pace_display == "4:30/km"
    assert result.actual_pace_display == "4:30/km"
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert result.adherence_score >= 95.0


def test_compute_adherence_slower_pace():
    """Running 60s/km slower should reduce score significantly."""
    steps = make_steps([
        {"stepType": "active", "endCondition": "distance", "endConditionValue": 5000,
         "targetType": "pace", "targetValueOne": 1000 / 270},  # 4:30/km plan
    ])
    activity = FakeActivity(distance_m=5000.0, avg_pace_min_km=5.5)  # 5:30/km = 60s slower
    result = adh.compute_adherence(activity, steps)

    assert result.pace_delta_sec_per_km == pytest.approx(60.0, abs=1.0)
    assert result.adherence_score < 80.0


def test_planned_pace_weighted_average_for_alternating_intervals():
    """Repeat block alternating fast + slow intervals uses distance-weighted avg pace.

    A 7×(300m fast @ 4:50/km + 300m slow @ 5:35/km) workout has a blended
    expected pace of (290+335)/2 = 312.5 s/km ≈ 5:12/km. An actual pace of
    5:10/km (310 s/km) should register as ~2 s/km *faster* than plan and yield
    a high adherence score — not 21 s/km slower as the old first-step logic gave.
    """
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 7, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 300,
             "targetType": "pace", "targetValueOne": 1000 / 290},  # 4:50/km
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 300,
             "targetType": "pace", "targetValueOne": 1000 / 335},  # 5:35/km
        ]},
    ])
    # 14 × 300m laps alternating between the two paces; blended actual ≈ 5:12/km.
    lap_dtos = []
    for _ in range(7):
        lap_dtos.append({"distance": 300, "duration": 87, "intensityType": "INTERVAL"})   # 4:50/km
        lap_dtos.append({"distance": 300, "duration": 100.5, "intensityType": "INTERVAL"})# 5:35/km
    activity = FakeActivity(distance_m=4200.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    # Weighted planned pace = (290×300 + 335×300) × 7 / (600×7) = 312.5 s/km ≈ 5:12/km
    assert result.planned_pace_display == "5:12/km"

    # Actual blended pace ≈ 312.5 s/km → delta near 0, not 20+ s slower.
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=2.0)
    assert result.adherence_score >= 95.0


def test_compute_adherence_interval_count_from_repeat():
    """3x interval in a repeat block → planned_intervals = 3."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "time", "endConditionValue": 600},
        {"stepType": "repeat", "repeatCount": 3, "workoutSteps": [
            {"stepType": "active", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 270},
            {"stepType": "recovery", "endCondition": "time", "endConditionValue": 120},
        ]},
        {"stepType": "cool_down", "endCondition": "time", "endConditionValue": 600},
    ])
    activity = FakeActivity(distance_m=4200.0, avg_pace_min_km=4.5, laps_json='[{},{},{}]')
    result = adh.compute_adherence(activity, steps)

    assert result.planned_intervals == 3
    assert result.actual_laps == 3


def test_compute_adherence_laps_from_json():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(
        distance_m=5000.0,
        laps_json=json.dumps([{"lap": 1}, {"lap": 2}, {"lap": 3}]),
    )
    result = adh.compute_adherence(activity, steps)
    assert result.actual_laps == 3


def test_compute_adherence_laps_invalid_json():
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=5000.0, laps_json="not json")
    result = adh.compute_adherence(activity, steps)
    assert result.actual_laps is None


def test_compute_adherence_no_distance_no_pace():
    """Time-only steps with no pace target → no comparison, score = 100."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "time", "endConditionValue": 1800},
    ])
    activity = FakeActivity(distance_m=7000.0, avg_pace_min_km=4.2)
    result = adh.compute_adherence(activity, steps)
    assert result.planned_distance_m is None
    assert result.planned_pace_display is None
    assert result.adherence_score == 100.0
    assert "no distance" in result.summary.lower()


# ---------------------------------------------------------------------------
# Rest-aware distance & pace (running-only)
# ---------------------------------------------------------------------------

def test_planned_distance_excludes_rest():
    """Rest steps are excluded from planned distance and tracked separately."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
            {"stepType": "rest", "endCondition": "distance", "endConditionValue": 200},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    activity = FakeActivity(distance_m=6800.0)
    result = adh.compute_adherence(activity, steps)

    # running = 1000 warmup + 4×1000 intervals + 1000 cooldown = 6000
    assert result.planned_distance_m == pytest.approx(6000.0)
    # rest = 4 × 200 = 800
    assert result.planned_rest_distance_m == pytest.approx(800.0)


def test_planned_distance_time_based_running_interval():
    """A running interval given in time is converted to distance via its pace."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 6, "workoutSteps": [
            {"stepType": "interval", "endCondition": "time", "endConditionValue": 60,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km → 250 m/min
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    activity = FakeActivity(distance_m=1500.0)
    result = adh.compute_adherence(activity, steps)

    # 6 × (60s at 4:00/km = 250 m) = 1500 m running
    assert result.planned_distance_m == pytest.approx(1500.0)


def test_time_interval_without_pace_uses_planned_pace_fallback():
    """A time-based step with no target falls back to the workout's planned pace."""
    steps = make_steps([
        {"stepType": "warm_up", "endCondition": "time", "endConditionValue": 240},  # no pace
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 3000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
    ])
    activity = FakeActivity(distance_m=4000.0)
    result = adh.compute_adherence(activity, steps)

    # warmup 240s @ 4:00/km (fallback) = 1000 m, + 3000 m interval = 4000 m
    assert result.planned_distance_m == pytest.approx(4000.0)


def test_actual_from_splits_rest_and_running_pace():
    """Actual running/rest distance and running-only pace come from lapDTOs."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 6000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
    ])
    laps = {"lapDTOs": [
        {"distance": 3000, "duration": 720, "intensityType": "ACTIVE"},   # 4:00/km
        {"distance": 245, "duration": 90, "intensityType": "REST"},
        {"distance": 3000, "duration": 720, "intensityType": "ACTIVE"},   # 4:00/km
        {"distance": 245, "duration": 90, "intensityType": "RECOVERY"},
    ]}
    activity = FakeActivity(
        distance_m=6490.0, avg_pace_min_km=5.0,  # overall avg slower (includes rest)
        splits_json=json.dumps(laps),
    )
    result = adh.compute_adherence(activity, steps)

    assert result.actual_distance_m == pytest.approx(6000.0)        # running only
    assert result.actual_rest_distance_m == pytest.approx(490.0)    # rest laps
    assert result.actual_pace_display == "4:00/km"                  # running-only, not 5:00
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert "490 m in rest" in result.summary


def test_worked_example_8km_plus_490m_rest():
    """Reproduce the target: 8.00 km planned / 8.00 km (+490 m rest) actual."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "repeat", "repeatCount": 6, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    # 6 running laps + warmup + cooldown = 8 running laps (8 km), 6 rest laps (490 m)
    lap_dtos = (
        [{"distance": 1000, "duration": 240, "intensityType": "WARMUP"}]
        + [
            lap
            for _ in range(6)
            for lap in (
                {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
                {"distance": 81.67, "duration": 90, "intensityType": "REST"},
            )
        ]
        + [{"distance": 1000, "duration": 240, "intensityType": "COOLDOWN"}]
    )
    activity = FakeActivity(distance_m=8490.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.planned_distance_m == pytest.approx(8000.0)
    assert f"{result.actual_distance_m / 1000:.2f}" == "8.00"
    assert int(round(result.actual_rest_distance_m)) == 490
    assert result.distance_pct == 100.0


def test_actual_fallback_no_splits_uses_totals():
    """Without lapDTOs, actual falls back to activity totals (no rest split)."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    activity = FakeActivity(distance_m=4800.0, avg_pace_min_km=4.5)
    result = adh.compute_adherence(activity, steps)

    assert result.actual_distance_m == 4800.0
    assert result.actual_rest_distance_m is None
    assert result.actual_pace_display == "4:30/km"


def test_actual_pace_excludes_warmup_cooldown():
    """Warmup/cooldown laps count toward distance but not the pace average.

    The intervals are run on target (4:00/km) while the warmup/cooldown are
    easy (6:00/km). Pace adherence should reflect the on-target intervals, not
    a blended average dragged slower by the easy laps.
    """
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 4000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    laps = {"lapDTOs": [
        {"distance": 1000, "duration": 360, "intensityType": "WARMUP"},    # 6:00/km
        {"distance": 4000, "duration": 960, "intensityType": "INTERVAL"},  # 4:00/km
        {"distance": 1000, "duration": 360, "intensityType": "COOLDOWN"},  # 6:00/km
    ]}
    activity = FakeActivity(distance_m=6000.0, splits_json=json.dumps(laps))
    result = adh.compute_adherence(activity, steps)

    assert result.actual_distance_m == pytest.approx(6000.0)  # incl. warmup/cooldown
    assert result.actual_pace_display == "4:00/km"            # work intervals only
    assert result.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert result.adherence_score >= 95.0


def test_actual_pace_fallback_when_no_work_laps():
    """With only warmup/cooldown laps, pace falls back to all running laps."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000,
         "targetType": "pace", "targetValueOne": 1000 / 270},  # 4:30/km plan
    ])
    laps = {"lapDTOs": [
        {"distance": 2500, "duration": 675, "intensityType": "WARMUP"},   # 4:30/km
        {"distance": 2500, "duration": 675, "intensityType": "COOLDOWN"}, # 4:30/km
    ]}
    activity = FakeActivity(distance_m=5000.0, splits_json=json.dumps(laps))
    result = adh.compute_adherence(activity, steps)

    assert result.actual_pace_display == "4:30/km"


# ---------------------------------------------------------------------------
# Per-interval adherence (lap ↔ step alignment)
# ---------------------------------------------------------------------------

def test_ordered_laps_parses_in_order():
    laps = {"lapDTOs": [
        {"distance": 1000, "duration": 360, "intensityType": "WARMUP"},
        {"distance": 400, "duration": 90, "intensityType": "INTERVAL"},
        {"distance": 0, "duration": 0, "intensityType": "REST"},          # skipped (no distance)
        {"distance": 200, "duration": 90, "intensityType": "RECOVERY"},
    ]}
    activity = FakeActivity(splits_json=json.dumps(laps))
    result = adh._ordered_laps(activity)

    assert len(result) == 3
    assert result[0]["intensity"] == "WARMUP"
    assert result[0]["is_rest"] is False
    assert result[1]["pace_sec"] == pytest.approx(225.0)  # 90s / 0.4km
    assert result[2]["is_rest"] is True


def test_ordered_laps_empty_without_splits():
    assert adh._ordered_laps(FakeActivity()) == []
    assert adh._ordered_laps(FakeActivity(splits_json="not json")) == []


def test_align_intervals_per_rep_deltas():
    """warmup + 4×(interval+rest) + cooldown → 10 laps, per-rep deltas."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    # Rep 1 on target (4:00), rep 2 slower (4:10), reps 3-4 on target.
    lap_dtos = (
        [{"distance": 1000, "duration": 360, "intensityType": "WARMUP"}]
        + [
            {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
            {"distance": 80, "duration": 90, "intensityType": "REST"},
            {"distance": 1000, "duration": 250, "intensityType": "INTERVAL"},  # 4:10
            {"distance": 80, "duration": 90, "intensityType": "REST"},
            {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
            {"distance": 80, "duration": 90, "intensityType": "REST"},
            {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
            {"distance": 80, "duration": 90, "intensityType": "REST"},
        ]
        + [{"distance": 1000, "duration": 360, "intensityType": "COOLDOWN"}]
    )
    activity = FakeActivity(distance_m=4640.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    assert len(result.intervals) == 10

    labels = [iv.label for iv in result.intervals]
    assert labels[0] == "Warmup"
    assert labels[1] == "Interval 1"
    assert labels[2] == "Recovery 1"
    assert labels[7] == "Interval 4"
    assert labels[9] == "Cooldown"

    # Rep 1 on target.
    interval1 = result.intervals[1]
    assert interval1.actual_pace_display == "4:00/km"
    assert interval1.pace_delta_sec_per_km == pytest.approx(0.0, abs=1.0)
    assert interval1.matched is True

    # Rep 2 ran 10s/km slower.
    interval2 = result.intervals[3]
    assert interval2.pace_delta_sec_per_km == pytest.approx(10.0, abs=1.0)

    # Rest steps carry no pace grade.
    recovery1 = result.intervals[2]
    assert recovery1.step_type == "rest"
    assert recovery1.actual_pace_display is None


def test_align_intervals_count_mismatch_marks_unmatched():
    """Fewer laps than steps → trailing step is unmatched, no crash."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 3, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 400,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 60},
        ]},
    ])
    # Only 5 laps for 6 steps (athlete stopped early).
    lap_dtos = [
        {"distance": 400, "duration": 96, "intensityType": "INTERVAL"},
        {"distance": 50, "duration": 60, "intensityType": "REST"},
        {"distance": 400, "duration": 96, "intensityType": "INTERVAL"},
        {"distance": 50, "duration": 60, "intensityType": "REST"},
        {"distance": 400, "duration": 96, "intensityType": "INTERVAL"},
    ]
    activity = FakeActivity(distance_m=1300.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert len(result.intervals) == 6
    assert result.intervals[-1].matched is False
    assert result.intervals[-1].actual_distance_m is None


def test_align_intervals_autolap_split_and_standalone_rest():
    """Real-world case: per-km auto-lap splits the warmup, plus a standalone rest.

    Planned: 2km warmup, standalone 90s rest, 5×(1km @ 4:55, 90s rest), 1km
    cooldown. Garmin auto-laps every 1 km, so the 2 km warmup is recorded as two
    1 km laps — the lap count no longer matches the step count. Channel alignment
    must still pair the warmup step with the full 2 km, intervals with the 1 km
    work laps, and rests with the short jog-rest laps (not shift everything).
    """
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 2000,
         "description": "2km warm up"},
        {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        {"stepType": "repeat", "repeatCount": 5, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 295},  # 4:55/km
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    # Executed laps: warmup auto-split into two 1km WARMUP laps, then the
    # standalone rest, then 5×(1km interval @ ~4:50, ~125m jog-rest), cooldown.
    lap_dtos = [
        {"distance": 1000, "duration": 373, "intensityType": "WARMUP"},   # 6:13/km
        {"distance": 1000, "duration": 373, "intensityType": "WARMUP"},
        {"distance": 125, "duration": 90, "intensityType": "REST"},        # standalone rest
    ]
    for _ in range(5):
        lap_dtos.append({"distance": 1000, "duration": 290, "intensityType": "INTERVAL"})  # 4:50
        lap_dtos.append({"distance": 129, "duration": 90, "intensityType": "REST"})
    lap_dtos.append({"distance": 1000, "duration": 290, "intensityType": "COOLDOWN"})

    activity = FakeActivity(distance_m=8645.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    by_label = {iv.label: iv for iv in result.intervals}

    # Warmup paired with the FULL 2 km (both auto-lap segments merged), not 1 km.
    warmup = by_label["Warmup"]
    assert warmup.actual_distance_m == pytest.approx(2000.0)
    assert warmup.planned_distance_m == pytest.approx(2000.0)

    # Every interval paired with a 1 km work lap on target (~5s/km faster), NOT
    # with a short rest lap (which was the alignment bug).
    for n in range(1, 6):
        iv = by_label[f"Interval {n}"]
        assert iv.actual_distance_m == pytest.approx(1000.0)
        assert iv.pace_delta_sec_per_km == pytest.approx(-5.0, abs=1.0)

    # Cooldown paired with the 1 km cooldown lap, not a rest lap.
    assert by_label["Cooldown"].actual_distance_m == pytest.approx(1000.0)

    # Warmup/cooldown have no pace target of their own: actual pace is shown for
    # reference but they are NOT graded against the interval pace (no delta, no
    # invented planned pace).
    assert warmup.actual_pace_display is not None
    assert warmup.planned_pace_display is None
    assert warmup.pace_delta_sec_per_km is None
    assert by_label["Cooldown"].pace_delta_sec_per_km is None
    assert by_label["Cooldown"].planned_pace_display is None

    # Recoveries paired with the short jog-rest laps; not pace-graded and — being
    # time-based with no target — carry no fabricated planned distance.
    rec1 = by_label["Recovery 1"]
    assert rec1.actual_distance_m == pytest.approx(125.0)
    assert rec1.actual_pace_display is None
    assert rec1.planned_distance_m is None
    assert rec1.distance_delta_m is None


def test_align_intervals_repeat_alternating_same_intensity():
    """7×(fast 300m + slow 300m + 90s rest) where Garmin tags both runs INTERVAL.

    The old merge-by-intensity logic collapsed all 14 run laps into one 4.20 km
    segment, matching only Interval 1 and marking Intervals 2-14 as missed.
    Distance-guided consumption must match each lap to its own planned step.
    """
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 2000},
        {"stepType": "repeat", "repeatCount": 7, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 300,
             "targetType": "pace", "targetValueOne": 1000 / 280},  # 4:40/km
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 300,
             "targetType": "pace", "targetValueOne": 1000 / 335},  # 5:35/km
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1500},
    ])
    lap_dtos = [{"distance": 2000, "duration": 693, "intensityType": "WARMUP"}]
    for _ in range(7):
        lap_dtos.append({"distance": 300, "duration": 84, "intensityType": "INTERVAL"})   # 4:42/km
        lap_dtos.append({"distance": 300, "duration": 101, "intensityType": "INTERVAL"})  # 5:37/km
        lap_dtos.append({"distance": 118, "duration": 90, "intensityType": "REST"})
    lap_dtos.append({"distance": 1500, "duration": 540, "intensityType": "COOLDOWN"})

    activity = FakeActivity(distance_m=7710.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    # warmup + 7×(fast + slow + rest) + cooldown = 23 rows
    assert len(result.intervals) == 23

    interval_rows = [iv for iv in result.intervals if iv.label.startswith("Interval")]
    assert len(interval_rows) == 14

    # Every interval must be matched with ~300m actual distance.
    for iv in interval_rows:
        assert iv.matched is True, f"{iv.label} was not matched"
        assert iv.actual_distance_m == pytest.approx(300.0)

    # Fast intervals (odd-numbered 1,3,5,...): should be ~2s slower than 4:40 target.
    fast_intervals = interval_rows[0::2]
    for iv in fast_intervals:
        assert iv.pace_delta_sec_per_km == pytest.approx(2.0, abs=2.0)

    # Slow intervals (even-numbered 2,4,6,...): should be ~2s slower than 5:35 target.
    slow_intervals = interval_rows[1::2]
    for iv in slow_intervals:
        assert iv.pace_delta_sec_per_km == pytest.approx(2.0, abs=2.0)


# ---------------------------------------------------------------------------
# Per-interval scoring (P2-3)
# ---------------------------------------------------------------------------

def test_interval_score_on_target():
    """Interval run exactly on pace+distance → interval_score = 100."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 2, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    lap_dtos = [
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
        {"distance": 80, "duration": 90, "intensityType": "REST"},
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
        {"distance": 80, "duration": 90, "intensityType": "REST"},
    ]
    activity = FakeActivity(distance_m=2160.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    iv1 = next(iv for iv in result.intervals if iv.label == "Interval 1")
    assert iv1.interval_score == pytest.approx(100.0, abs=1.0)
    assert result.adherence_score >= 95.0


def test_interval_score_off_pace():
    """Interval run 60 s/km slower → interval_score near 0."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
         "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
         "targetType": "pace", "targetValueOne": 1000 / 240},
    ])
    lap_dtos = [
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},   # on target
        {"distance": 1000, "duration": 300, "intensityType": "INTERVAL"},   # 5:00/km = 60s slow
    ]
    activity = FakeActivity(distance_m=2000.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    iv2 = next(iv for iv in result.intervals if iv.label == "Interval 2")
    # 60 s/km off → pace score = 0; distance perfect → dist score = 100 → avg = 50
    assert iv2.interval_score == pytest.approx(50.0, abs=5.0)


def test_per_interval_score_beats_aggregate_for_cancel_out():
    """A workout where fast + slow intervals cancel to on-target aggregate.

    Aggregate scoring would give a near-perfect score because the mean pace
    is on target. Per-interval scoring must penalise each rep that deviated.
    """
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km plan
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    # Alternating: 30 s/km fast then 30 s/km slow → aggregate = on target (4:00/km).
    lap_dtos = [
        {"distance": 1000, "duration": 210, "intensityType": "INTERVAL"},   # 3:30/km
        {"distance": 80, "duration": 90, "intensityType": "REST"},
        {"distance": 1000, "duration": 270, "intensityType": "INTERVAL"},   # 4:30/km
        {"distance": 80, "duration": 90, "intensityType": "REST"},
        {"distance": 1000, "duration": 210, "intensityType": "INTERVAL"},   # 3:30/km
        {"distance": 80, "duration": 90, "intensityType": "REST"},
        {"distance": 1000, "duration": 270, "intensityType": "INTERVAL"},   # 4:30/km
        {"distance": 80, "duration": 90, "intensityType": "REST"},
    ]
    activity = FakeActivity(distance_m=4320.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    # Per-interval scoring: each rep is 30 s/km off → pace score ≈ 50 each → overall ~50.
    # Aggregate scoring: mean pace = 4:00/km → pace delta ≈ 0 → pace score ≈ 100.
    assert result.adherence_score < 90.0, (
        "Per-interval scoring should penalise cancel-out workouts; "
        f"got score {result.adherence_score:.1f}"
    )


def test_per_interval_score_perfect_workout_still_high():
    """All intervals executed on pace → per-interval scoring also gives high score."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},  # 4:00/km
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    lap_dtos = []
    for _ in range(4):
        lap_dtos.append({"distance": 1000, "duration": 240, "intensityType": "INTERVAL"})
        lap_dtos.append({"distance": 80, "duration": 90, "intensityType": "REST"})
    activity = FakeActivity(distance_m=4320.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.adherence_score >= 95.0


def test_missed_interval_penalises_score():
    """An unmatched (missed) interval step pushes per-interval score down."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 4, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    # Only 3 of 4 intervals executed.
    lap_dtos = []
    for _ in range(3):
        lap_dtos.append({"distance": 1000, "duration": 240, "intensityType": "INTERVAL"})
        lap_dtos.append({"distance": 80, "duration": 90, "intensityType": "REST"})
    activity = FakeActivity(distance_m=3240.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    # Missed interval scores 0 → 3 × 100 + 1 × 0 = avg 75, blended with distance %.
    assert result.adherence_score < 95.0


def test_interval_score_none_for_warmup_cooldown():
    """Warmup and cooldown rows carry no interval_score (no pace/distance target)."""
    steps = make_steps([
        {"stepType": "warmup", "endCondition": "distance", "endConditionValue": 1000},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
         "targetType": "pace", "targetValueOne": 1000 / 240},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
         "targetType": "pace", "targetValueOne": 1000 / 240},
        {"stepType": "cooldown", "endCondition": "distance", "endConditionValue": 1000},
    ])
    lap_dtos = [
        {"distance": 1000, "duration": 360, "intensityType": "WARMUP"},
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
        {"distance": 1000, "duration": 360, "intensityType": "COOLDOWN"},
    ]
    activity = FakeActivity(distance_m=4000.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is not None
    warmup = next(iv for iv in result.intervals if iv.step_type == "warmup")
    cooldown = next(iv for iv in result.intervals if iv.step_type == "cooldown")
    assert warmup.interval_score is None
    assert cooldown.interval_score is None


def test_align_intervals_none_for_trivial_workout():
    """A single-step workout has no interval structure → intervals None."""
    steps = make_steps([
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ])
    laps = {"lapDTOs": [{"distance": 5000, "duration": 1350, "intensityType": "ACTIVE"}]}
    activity = FakeActivity(distance_m=5000.0, splits_json=json.dumps(laps))
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is None


def test_align_intervals_none_without_lap_data():
    """Interval workout but no lapDTOs → no per-rep breakdown."""
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 3, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    activity = FakeActivity(distance_m=3000.0)
    result = adh.compute_adherence(activity, steps)

    assert result.intervals is None


def test_format_adherence_context_includes_intervals():
    steps = make_steps([
        {"stepType": "repeat", "repeatCount": 2, "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 1000,
             "targetType": "pace", "targetValueOne": 1000 / 240},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 90},
        ]},
    ])
    lap_dtos = [
        {"distance": 1000, "duration": 240, "intensityType": "INTERVAL"},
        {"distance": 80, "duration": 90, "intensityType": "REST"},
        {"distance": 1000, "duration": 250, "intensityType": "INTERVAL"},
        {"distance": 80, "duration": 90, "intensityType": "REST"},
    ]
    activity = FakeActivity(distance_m=2160.0, splits_json=json.dumps({"lapDTOs": lap_dtos}))
    result = adh.compute_adherence(activity, steps)
    ctx = adh.format_adherence_context(result)

    assert "Per-interval execution:" in ctx
    assert "Interval 1:" in ctx
    assert "Interval 2:" in ctx


# ---------------------------------------------------------------------------
# format_adherence_context
# ---------------------------------------------------------------------------

def test_format_adherence_context_full():
    adherence = WorkoutAdherence(
        planned_distance_m=7000.0,
        actual_distance_m=7200.0,
        distance_pct=100.0,
        planned_pace_display="4:30/km",
        actual_pace_display="4:28/km",
        pace_delta_sec_per_km=-2.0,
        planned_intervals=3,
        actual_laps=3,
        adherence_score=97.0,
        summary="100% of planned distance, 2s/km faster than target",
    )
    ctx = adh.format_adherence_context(adherence)
    assert "## Workout Adherence" in ctx
    assert "4:30/km" in ctx
    assert "4:28/km" in ctx
    assert "97" in ctx
    assert "3 planned" in ctx


def test_format_adherence_context_minimal():
    adherence = WorkoutAdherence(
        adherence_score=100.0,
        summary="Workout completed (no distance/pace plan to compare)",
    )
    ctx = adh.format_adherence_context(adherence)
    assert "## Workout Adherence" in ctx
    assert "100" in ctx
