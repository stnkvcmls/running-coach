"""
Contract / snapshot tests guarding against Garmin API schema drift.

Each section loads a recorded fixture payload and verifies:
  (a) all fields in the relevant contract are present, and
  (b) the extraction function produces the expected values.

When Garmin renames or removes a field the tests here will catch it before
the silent .get() fallback corrupts synced data. The drift-simulation tests
at the bottom explicitly check that check_payload_fields raises the alarm.
"""
import json
import os

import pytest

from app import garmin_sync, streams
from app.adherence import _actual_from_splits, parse_workout_steps
from app.models import Activity

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def _load(name: str) -> dict:
    with open(os.path.join(FIXTURES_DIR, name)) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Activity summary (get_activities list item)
# ---------------------------------------------------------------------------

def test_activity_summary_contract_all_fields_present():
    payload = _load("garmin_activity_summary.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._ACTIVITY_SUMMARY_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"
    assert result["missing"] == []


def test_activity_summary_extraction_garmin_id():
    payload = _load("garmin_activity_summary.json")
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["garmin_id"] == payload["activityId"]


def test_activity_summary_extraction_type_key():
    payload = _load("garmin_activity_summary.json")
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["activity_type"] == payload["activityType"]["typeKey"]
    assert fields["activity_type"] == "running"


def test_activity_summary_extraction_name_and_hr():
    payload = _load("garmin_activity_summary.json")
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["name"] == payload["activityName"]
    assert fields["avg_hr"] == payload["averageHR"]
    assert fields["max_hr"] == payload["maxHR"]
    assert fields["calories"] == payload["calories"]


def test_activity_summary_extraction_pace_from_duration_distance():
    payload = _load("garmin_activity_summary.json")
    fields = garmin_sync._extract_activity_fields(payload)
    expected_pace = (payload["duration"] / 60) / (payload["distance"] / 1000)
    assert fields["avg_pace_min_km"] == pytest.approx(expected_pace)


def test_activity_summary_missing_activityid_yields_none():
    payload = _load("garmin_activity_summary.json")
    del payload["activityId"]
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["garmin_id"] is None


def test_activity_summary_missing_activitytype_yields_unknown():
    payload = _load("garmin_activity_summary.json")
    del payload["activityType"]
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["activity_type"] == "unknown"


def test_activity_summary_missing_distance_no_pace():
    payload = _load("garmin_activity_summary.json")
    del payload["distance"]
    fields = garmin_sync._extract_activity_fields(payload)
    assert fields["avg_pace_min_km"] is None


# ---------------------------------------------------------------------------
# Daily stats (get_stats)
# ---------------------------------------------------------------------------

def test_daily_stats_contract_all_fields_present():
    payload = _load("garmin_daily_stats.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._DAILY_STATS_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"


def test_daily_stats_extraction_steps_and_hr():
    payload = _load("garmin_daily_stats.json")
    fields = garmin_sync._daily_summary_fields(payload, 30, 27000, 80, {})
    assert fields["steps"] == payload["totalSteps"]
    assert fields["resting_hr"] == payload["restingHeartRate"]
    assert fields["total_calories"] == payload["totalKilocalories"]


def test_daily_stats_extraction_intensity_minutes_summed():
    payload = _load("garmin_daily_stats.json")
    fields = garmin_sync._daily_summary_fields(payload, 30, 27000, 80, {})
    assert fields["intensity_minutes"] == (
        payload["moderateIntensityMinutes"] + payload["vigorousIntensityMinutes"]
    )


def test_daily_stats_missing_totalsteps_yields_none():
    payload = _load("garmin_daily_stats.json")
    del payload["totalSteps"]
    fields = garmin_sync._daily_summary_fields(payload, None, None, None, {})
    assert fields["steps"] is None


def test_daily_stats_missing_restingheartrate_yields_none():
    payload = _load("garmin_daily_stats.json")
    del payload["restingHeartRate"]
    fields = garmin_sync._daily_summary_fields(payload, None, None, None, {})
    assert fields["resting_hr"] is None


# ---------------------------------------------------------------------------
# Sleep data (get_sleep_data)
# ---------------------------------------------------------------------------

def test_sleep_data_contract_all_fields_present():
    payload = _load("garmin_sleep_data.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._SLEEP_DATA_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"


def test_sleep_data_sleep_seconds_extracted():
    payload = _load("garmin_sleep_data.json")
    sleep_seconds = payload.get("dailySleepDTO", {}).get("sleepTimeSeconds")
    assert sleep_seconds == 27000


def test_sleep_data_sleep_score_extracted():
    payload = _load("garmin_sleep_data.json")
    sleep_score = (
        payload.get("dailySleepDTO", {})
        .get("sleepScores", {})
        .get("overall", {})
        .get("value")
    )
    assert sleep_score == 78


def test_sleep_data_missing_dailysleep_dto_yields_none():
    payload = _load("garmin_sleep_data.json")
    del payload["dailySleepDTO"]
    sleep_seconds = payload.get("dailySleepDTO", {}).get("sleepTimeSeconds")
    assert sleep_seconds is None


# ---------------------------------------------------------------------------
# HRV data (get_hrv_data)
# ---------------------------------------------------------------------------

def test_hrv_data_contract_all_fields_present():
    payload = _load("garmin_hrv_data.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._HRV_DATA_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"


def test_hrv_data_values_extracted():
    payload = _load("garmin_hrv_data.json")
    hrv_summary = payload.get("hrvSummary", {})
    assert hrv_summary.get("lastNightAvg") == 48
    assert hrv_summary.get("weeklyAvg") == 44
    assert hrv_summary.get("status") == "BALANCED"


def test_hrv_data_missing_hrvsummary_yields_none():
    payload = _load("garmin_hrv_data.json")
    del payload["hrvSummary"]
    hrv_summary = (payload or {}).get("hrvSummary", {}) or {}
    assert hrv_summary.get("lastNightAvg") is None


# ---------------------------------------------------------------------------
# Activity stream (get_activity_details)
# ---------------------------------------------------------------------------

def test_activity_stream_contract_all_fields_present():
    payload = _load("garmin_activity_details.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._ACTIVITY_STREAM_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"


def test_activity_stream_parse_returns_all_channels():
    payload = _load("garmin_activity_details.json")
    parsed = streams.parse_streams(payload)
    assert parsed is not None
    for channel in ("time", "power", "speed", "hr", "elevation", "distance"):
        assert channel in parsed


def test_activity_stream_parse_sample_count_matches_fixture():
    payload = _load("garmin_activity_details.json")
    parsed = streams.parse_streams(payload)
    n = len(payload["activityDetailMetrics"])
    assert len(parsed["time"]) == n


def test_activity_stream_time_column_is_elapsed_seconds():
    payload = _load("garmin_activity_details.json")
    parsed = streams.parse_streams(payload)
    assert parsed["time"][0] == 0
    assert parsed["time"][-1] == 90


def test_activity_stream_power_values_within_bounds():
    payload = _load("garmin_activity_details.json")
    parsed = streams.parse_streams(payload)
    non_null = [v for v in parsed["power"] if v is not None]
    assert all(0 <= v <= 2000 for v in non_null)


def test_activity_stream_missing_metric_descriptors_returns_none():
    payload = _load("garmin_activity_details.json")
    del payload["metricDescriptors"]
    assert streams.parse_streams(payload) is None


def test_activity_stream_missing_detail_metrics_returns_none():
    payload = _load("garmin_activity_details.json")
    del payload["activityDetailMetrics"]
    assert streams.parse_streams(payload) is None


def test_activity_stream_key_renamed_causes_missing_channel():
    """If Garmin renames 'directHeartRate' to a name _normalize_key can't match,
    the hr stream goes all-None — a silent data loss the canary surfaces."""
    payload = _load("garmin_activity_details.json")
    for d in payload["metricDescriptors"]:
        if d["key"] == "directHeartRate":
            # "pulseBpm" contains none of the substrings _normalize_key checks
            d["key"] = "pulseBpm"
    parsed = streams.parse_streams(payload)
    assert parsed is not None
    assert all(v is None for v in parsed["hr"])


# ---------------------------------------------------------------------------
# Calendar response
# ---------------------------------------------------------------------------

def test_calendar_response_contract_all_fields_present():
    payload = _load("garmin_calendar_response.json")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._CALENDAR_RESPONSE_CONTRACT, "test"
    )
    assert result["ok"], f"Missing fields: {result['missing']}"


def test_calendar_response_race_parsed_correctly():
    payload = _load("garmin_calendar_response.json")
    events = garmin_sync._parse_calendar_response(payload)
    races = [e for e in events if e["event_type"] == "race"]
    assert len(races) == 2
    berlin = next(e for e in races if e["title"] == "Berlin Marathon")
    assert berlin["distance_label"] == "Marathon"
    assert berlin["priority"] == "A"


def test_calendar_response_workout_parsed_correctly():
    payload = _load("garmin_calendar_response.json")
    events = garmin_sync._parse_calendar_response(payload)
    workouts = [e for e in events if e["event_type"] == "workout"]
    assert len(workouts) == 1
    assert workouts[0]["title"] == "Easy Run"


def test_calendar_response_sleep_item_skipped():
    payload = _load("garmin_calendar_response.json")
    events = garmin_sync._parse_calendar_response(payload)
    assert all(e["event_type"] != "sleep" for e in events)


def test_calendar_response_missing_calendar_items_yields_empty():
    payload = _load("garmin_calendar_response.json")
    del payload["calendarItems"]
    events = garmin_sync._parse_calendar_response(payload)
    assert events == []


# ---------------------------------------------------------------------------
# Lap DTOs (get_activity_splits → splits_json, parsed by adherence)
# ---------------------------------------------------------------------------

def test_lap_dtos_top_level_key_present():
    payload = _load("garmin_lap_dtos.json")
    assert "lapDTOs" in payload


def test_lap_dtos_each_lap_has_required_fields():
    payload = _load("garmin_lap_dtos.json")
    required = {"distance", "intensityType", "duration"}
    for lap in payload["lapDTOs"]:
        missing = required - set(lap.keys())
        assert not missing, f"Lap {lap.get('lapIndex')} missing fields: {missing}"


def test_lap_dtos_actual_from_splits_running_distance():
    payload = _load("garmin_lap_dtos.json")
    activity = Activity(
        garmin_id=1, name="Run", activity_type="running",
        splits_json=json.dumps(payload),
        distance_m=8000,
        avg_pace_min_km=5.0,
    )
    running_dist, rest_dist, pace_sec = _actual_from_splits(activity)
    # warmup(1000) + active(3000) + active(3000) + cooldown(1000) = 8000m, no rest
    assert running_dist == pytest.approx(8000.0)
    assert rest_dist is None


def test_lap_dtos_actual_from_splits_pace_from_work_laps():
    payload = _load("garmin_lap_dtos.json")
    activity = Activity(
        garmin_id=1, name="Run", activity_type="running",
        splits_json=json.dumps(payload),
        distance_m=8000,
        avg_pace_min_km=5.0,
    )
    _, _, pace_sec = _actual_from_splits(activity)
    # Work laps: 3000m/750s + 3000m/760s → total work 6000m / 1510s
    assert pace_sec == pytest.approx(1510 / 6.0, rel=0.01)


def test_lap_dtos_missing_lapdtos_key_falls_back_to_totals():
    activity = Activity(
        garmin_id=1, name="Run", activity_type="running",
        splits_json=json.dumps({}),
        distance_m=5000,
        avg_pace_min_km=5.0,
    )
    running_dist, rest_dist, pace_sec = _actual_from_splits(activity)
    assert running_dist == 5000
    assert rest_dist is None
    assert pace_sec == pytest.approx(300.0)  # 5.0 min/km × 60 = 300 s/km


# ---------------------------------------------------------------------------
# Workout steps (raw_json parsed by adherence.parse_workout_steps)
# ---------------------------------------------------------------------------

def test_workout_steps_top_level_key_present():
    payload = _load("garmin_workout_steps.json")
    assert "workoutSteps" in payload


def test_workout_steps_each_step_has_required_fields():
    payload = _load("garmin_workout_steps.json")
    required = {"stepType", "endCondition", "endConditionValue"}
    for step in payload["workoutSteps"]:
        missing = required - set(step.keys())
        assert not missing, f"Step {step.get('stepOrder')} missing fields: {missing}"


def test_workout_steps_parse_count_and_types():
    payload = _load("garmin_workout_steps.json")
    steps = parse_workout_steps(json.dumps(payload))
    assert len(steps) == 3
    assert steps[0].step_type == "warmup"
    assert steps[1].step_type == "interval"
    assert steps[2].step_type == "cooldown"


def test_workout_steps_parse_end_condition_and_value():
    payload = _load("garmin_workout_steps.json")
    steps = parse_workout_steps(json.dumps(payload))
    interval = steps[1]
    assert interval.end_condition == "distance"
    assert interval.end_condition_value == pytest.approx(6000.0)


def test_workout_steps_parse_pace_target_on_interval():
    payload = _load("garmin_workout_steps.json")
    steps = parse_workout_steps(json.dumps(payload))
    interval = steps[1]
    assert interval.target_type == "pace"
    assert interval.target_display is not None
    assert "/km" in interval.target_display


def test_workout_steps_missing_workoutsteps_yields_empty():
    steps = parse_workout_steps(json.dumps({"workoutId": 1}))
    assert steps == []


# ---------------------------------------------------------------------------
# check_payload_fields utility
# ---------------------------------------------------------------------------

def test_check_payload_fields_ok_all_present():
    result = garmin_sync.check_payload_fields({"a": 1, "b": 2}, ["a", "b"], "test")
    assert result["ok"] is True
    assert result["missing"] == []
    assert set(result["present"]) == {"a", "b"}


def test_check_payload_fields_detects_single_missing():
    result = garmin_sync.check_payload_fields({"a": 1}, ["a", "b"], "test")
    assert result["ok"] is False
    assert "b" in result["missing"]
    assert "a" in result["present"]


def test_check_payload_fields_detects_all_missing():
    result = garmin_sync.check_payload_fields({}, ["a", "b", "c"], "test")
    assert result["ok"] is False
    assert set(result["missing"]) == {"a", "b", "c"}
    assert result["present"] == []


def test_check_payload_fields_non_dict_payload():
    result = garmin_sync.check_payload_fields(None, ["a", "b"], "test")
    assert result["ok"] is False
    assert result["missing"] == ["a", "b"]
    assert result["present"] == []


def test_check_payload_fields_empty_contract_always_ok():
    result = garmin_sync.check_payload_fields({"x": 1}, [], "test")
    assert result["ok"] is True


def test_drift_simulation_activity_type_renamed():
    """Garmin renames 'activityType' → 'sportType': check_payload_fields catches it."""
    payload = _load("garmin_activity_summary.json")
    payload["sportType"] = payload.pop("activityType")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._ACTIVITY_SUMMARY_CONTRACT, "test"
    )
    assert result["ok"] is False
    assert "activityType" in result["missing"]


def test_drift_simulation_totalsteps_renamed():
    """Garmin renames 'totalSteps' → 'stepCount': check_payload_fields catches it."""
    payload = _load("garmin_daily_stats.json")
    payload["stepCount"] = payload.pop("totalSteps")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._DAILY_STATS_CONTRACT, "test"
    )
    assert result["ok"] is False
    assert "totalSteps" in result["missing"]


def test_drift_simulation_hrvsummary_removed():
    """Garmin removes 'hrvSummary': check_payload_fields catches it."""
    payload = _load("garmin_hrv_data.json")
    del payload["hrvSummary"]
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._HRV_DATA_CONTRACT, "test"
    )
    assert result["ok"] is False
    assert "hrvSummary" in result["missing"]


def test_drift_simulation_stream_descriptors_removed():
    """Garmin removes 'metricDescriptors': both the check and parse_streams catch it."""
    payload = _load("garmin_activity_details.json")
    del payload["metricDescriptors"]
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._ACTIVITY_STREAM_CONTRACT, "test"
    )
    assert result["ok"] is False
    assert "metricDescriptors" in result["missing"]
    assert streams.parse_streams(payload) is None


def test_drift_simulation_calendar_items_renamed():
    """Garmin renames 'calendarItems' → 'items': check returns empty events."""
    payload = _load("garmin_calendar_response.json")
    payload["items"] = payload.pop("calendarItems")
    result = garmin_sync.check_payload_fields(
        payload, garmin_sync._CALENDAR_RESPONSE_CONTRACT, "test"
    )
    assert result["ok"] is False
    events = garmin_sync._parse_calendar_response(payload)
    assert events == []


# ---------------------------------------------------------------------------
# get_canary_status (P3-4): in-memory record of the last check per source
# ---------------------------------------------------------------------------

def test_get_canary_status_records_ok_check():
    garmin_sync.check_payload_fields({"a": 1, "b": 2}, ["a", "b"], "p3_4_ok_source")
    status = garmin_sync.get_canary_status()
    assert status["p3_4_ok_source"]["ok"] is True
    assert status["p3_4_ok_source"]["missing"] == []
    assert status["p3_4_ok_source"]["checked_at"] is not None


def test_get_canary_status_records_drift():
    garmin_sync.check_payload_fields({"a": 1}, ["a", "b"], "p3_4_drift_source")
    status = garmin_sync.get_canary_status()
    assert status["p3_4_drift_source"]["ok"] is False
    assert status["p3_4_drift_source"]["missing"] == ["b"]


def test_get_canary_status_records_non_dict_payload():
    garmin_sync.check_payload_fields(None, ["a"], "p3_4_non_dict_source")
    status = garmin_sync.get_canary_status()
    assert status["p3_4_non_dict_source"]["ok"] is False
    assert status["p3_4_non_dict_source"]["missing"] == ["a"]


def test_get_canary_status_overwritten_by_later_check():
    garmin_sync.check_payload_fields({"a": 1}, ["a", "b"], "p3_4_overwrite_source")
    assert garmin_sync.get_canary_status()["p3_4_overwrite_source"]["ok"] is False
    garmin_sync.check_payload_fields({"a": 1, "b": 2}, ["a", "b"], "p3_4_overwrite_source")
    assert garmin_sync.get_canary_status()["p3_4_overwrite_source"]["ok"] is True


def test_get_canary_status_returns_a_copy():
    garmin_sync.check_payload_fields({"a": 1}, ["a"], "p3_4_copy_source")
    status = garmin_sync.get_canary_status()
    status["p3_4_copy_source"]["ok"] = False
    assert garmin_sync.get_canary_status()["p3_4_copy_source"]["ok"] is True
