import json
from datetime import date

import pytest

from app import api
from app import adherence as adh
from app.models import GarminCalendarEvent


# --- Formatters (now in app.adherence) ---

@pytest.mark.parametrize("meters,expected", [
    (500, "500m"),
    (999, "999m"),
    (1000, "1km"),
    (2000, "2km"),
    (2400, "2.4km"),
    (1500, "1.5km"),
])
def test_format_step_distance(meters, expected):
    assert adh._format_step_distance(meters) == expected


@pytest.mark.parametrize("seconds,expected", [
    (45, "45s"),
    (59, "59s"),
    (60, "1 min"),
    (90, "1:30"),
    (125, "2:05"),
    (600, "10 min"),
])
def test_format_step_duration(seconds, expected):
    assert adh._format_step_duration(seconds) == expected


@pytest.mark.parametrize("mps,expected", [
    (0, ""),
    (-1, ""),
    (1000 / 300, "5:00/km"),   # 300 s/km
    (1000 / 265, "4:25/km"),   # 265 s/km
])
def test_format_pace(mps, expected):
    assert adh._format_pace(mps) == expected


# --- _garmin_str ---

def test_garmin_str_plain_string():
    assert adh._garmin_str("warmup") == "warmup"


def test_garmin_str_key_dict():
    assert adh._garmin_str({"stepTypeKey": "warmup", "stepTypeId": 1}) == "warmup"


def test_garmin_str_fallback_string_value():
    assert adh._garmin_str({"foo": 1, "bar": "value"}) == "value"


def test_garmin_str_empty():
    assert adh._garmin_str(123) == ""
    assert adh._garmin_str({"id": 5}) == ""


# --- _parse_step_target ---

def test_parse_step_target_pace_range():
    step = {"targetType": "pace.zone", "targetValueOne": 1000 / 300, "targetValueTwo": 1000 / 280}
    target_type, display = adh._parse_step_target(step)
    assert target_type == "pace"
    # Both bounds are rendered as a range.
    assert display == "4:40/km - 5:00/km"


def test_parse_step_target_single_pace():
    step = {"targetType": "speed", "targetValueOne": 1000 / 300}
    target_type, display = adh._parse_step_target(step)
    assert target_type == "pace"
    assert display == "5:00/km"


def test_parse_step_target_heart_rate_zone():
    step = {"targetType": "heart.rate.zone", "zoneNumber": 3}
    target_type, display = adh._parse_step_target(step)
    assert target_type == "heart_rate"
    assert display == "HR Zone 3"


def test_parse_step_target_open():
    assert adh._parse_step_target({"targetType": "open"}) == ("open", None)
    assert adh._parse_step_target({}) == ("open", None)


# --- _classify_activity_type ---

@pytest.mark.parametrize("step_type,expected", [
    ("rest", "rest"),
    ("recovery", "rest"),
    ("recover", "rest"),
    ("interval", "run"),
    ("warmup", "run"),
])
def test_classify_activity_type(step_type, expected):
    assert adh._classify_activity_type(step_type) == expected


# --- _parse_single_step ---

def test_parse_single_step_interval_distance():
    step = {
        "stepType": "interval",
        "endCondition": "distance",
        "endConditionValue": 1000,
        "targetType": "pace",
        "targetValueOne": 1000 / 300,
        "description": "Hard effort",
    }
    parsed = adh._parse_single_step(step, order=2)
    assert parsed.step_order == 2
    assert parsed.step_type == "interval"
    assert parsed.end_condition == "distance"
    assert parsed.end_condition_display == "1km"
    assert parsed.end_condition_value == 1000
    assert parsed.target_type == "pace"
    assert parsed.activity_type == "run"
    assert parsed.description == "Hard effort"


def test_parse_single_step_time_and_lap_button():
    timed = adh._parse_single_step(
        {"stepType": "rest", "endCondition": "time", "endConditionValue": 90}, 1
    )
    assert timed.step_type == "rest"
    assert timed.end_condition == "time"
    assert timed.end_condition_display == "1:30"
    assert timed.activity_type == "rest"

    lap = adh._parse_single_step({"stepType": "interval", "endCondition": "lap.button"}, 1)
    assert lap.end_condition == "lap_button"
    assert lap.end_condition_display == "Lap Button"


def test_parse_single_step_type_normalization():
    assert adh._parse_single_step({"stepType": "warm_up"}, 1).step_type == "warmup"
    assert adh._parse_single_step({"stepType": "cool_down"}, 1).step_type == "cooldown"
    assert adh._parse_single_step({"stepType": "active"}, 1).step_type == "interval"


def test_parse_single_step_repeat_with_nested():
    step = {
        "stepType": "repeat",
        "repeatCount": 4,
        "workoutSteps": [
            {"stepType": "interval", "endCondition": "distance", "endConditionValue": 400},
            {"stepType": "rest", "endCondition": "time", "endConditionValue": 60},
        ],
    }
    parsed = adh._parse_single_step(step, 1)
    assert parsed.step_type == "repeat"
    assert parsed.repeat_count == 4
    assert parsed.steps is not None and len(parsed.steps) == 2
    assert parsed.steps[0].step_type == "interval"
    assert parsed.steps[1].step_type == "rest"


# --- parse_workout_steps ---

def test_parse_workout_steps_top_level():
    raw = json.dumps({"workoutSteps": [
        {"stepType": "warmup", "endCondition": "time", "endConditionValue": 600},
        {"stepType": "interval", "endCondition": "distance", "endConditionValue": 5000},
    ]})
    steps = adh.parse_workout_steps(raw)
    assert len(steps) == 2
    assert [s.step_order for s in steps] == [1, 2]


def test_parse_workout_steps_from_segments():
    raw = json.dumps({"workoutSegments": [
        {"workoutSteps": [{"stepType": "interval", "endCondition": "lap.button"}]},
    ]})
    steps = adh.parse_workout_steps(raw)
    assert len(steps) == 1
    assert steps[0].step_type == "interval"


def test_parse_workout_steps_invalid_json():
    assert adh.parse_workout_steps("{bad json") == []


def test_parse_workout_steps_skips_non_dicts():
    raw = json.dumps({"steps": ["not a dict", {"stepType": "interval"}]})
    steps = adh.parse_workout_steps(raw)
    assert len(steps) == 1


# --- _enrich_event_with_steps ---

def test_enrich_event_workout_with_steps():
    event = GarminCalendarEvent(
        id=1,
        garmin_id="w1",
        event_type="workout",
        date=date(2026, 6, 17),
        title="Intervals",
        raw_json=json.dumps({"workoutSteps": [{"stepType": "warmup", "endCondition": "lap.button"}]}),
    )
    resp = api._enrich_event_with_steps(event)
    assert resp.workout_steps is not None
    assert len(resp.workout_steps) == 1


def test_enrich_event_race_has_no_steps():
    event = GarminCalendarEvent(
        id=2,
        garmin_id="r1",
        event_type="race",
        date=date(2026, 6, 17),
        title="10K",
        raw_json=json.dumps({"workoutSteps": []}),
    )
    resp = api._enrich_event_with_steps(event)
    assert resp.workout_steps is None


# --- _parse_date ---

def test_parse_date_valid():
    assert api._parse_date("2026-06-17") == date(2026, 6, 17)


def test_parse_date_invalid_falls_back_to_today():
    assert api._parse_date("not-a-date") == date.today()


def test_parse_date_none_falls_back_to_today():
    assert api._parse_date(None) == date.today()
