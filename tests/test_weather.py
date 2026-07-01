"""Tests for app/weather.py — heat-adjustment helpers."""

import json
import pytest

from app.weather import heat_pace_adjustment, parse_weather, weather_pace_info


# --- parse_weather ---

def test_parse_weather_none():
    assert parse_weather(None) is None


def test_parse_weather_dict_passthrough():
    d = {"temperature": 20, "dewPoint": 15}
    assert parse_weather(d) is d


def test_parse_weather_valid_json_string():
    d = {"temperature": 23, "dewPoint": 18}
    result = parse_weather(json.dumps(d))
    assert result == d


def test_parse_weather_invalid_json():
    assert parse_weather("not json") is None


def test_parse_weather_non_dict_json():
    assert parse_weather("[1, 2, 3]") is None


# --- heat_pace_adjustment ---

def test_no_penalty_at_baseline():
    factor, pct = heat_pace_adjustment(10.0, 5.0)
    assert factor == pytest.approx(1.0)
    assert pct == pytest.approx(0.0)


def test_no_penalty_below_baseline():
    factor, pct = heat_pace_adjustment(5.0, 0.0)
    assert factor == pytest.approx(1.0)
    assert pct == pytest.approx(0.0)


def test_temperature_only_penalty():
    # 20°C, low dew point — 10°C above baseline → 4 % temp penalty
    factor, pct = heat_pace_adjustment(20.0, 5.0)
    assert pct == pytest.approx(4.0)
    assert factor == pytest.approx(1.04)


def test_dew_point_adds_humidity_penalty():
    # 20°C + 20°C dew point: 4 % temp + 6 % dp = 10 %
    factor, pct = heat_pace_adjustment(20.0, 20.0)
    assert pct == pytest.approx(10.0)
    assert factor == pytest.approx(1.10)


def test_none_inputs_use_defaults():
    # None temp → assumed 10°C (no temp penalty), None dp → assumed 5°C (no dp penalty)
    factor, pct = heat_pace_adjustment(None, None)
    assert factor == pytest.approx(1.0)
    assert pct == pytest.approx(0.0)


def test_hot_humid_conditions():
    # 30°C, dew point 22°C: (20 * 0.4) + (12 * 0.6) = 8 + 7.2 = 15.2 %
    factor, pct = heat_pace_adjustment(30.0, 22.0)
    assert pct == pytest.approx(15.2)
    assert factor == pytest.approx(1.152)


# --- weather_pace_info ---
#
# Garmin's activity-weather API returns temp/dewPoint in Fahrenheit regardless
# of locale (confirmed: a Garmin app showing 14°C corresponded to a stored
# "temp": 57 in the raw payload — 57°F == 13.9°C). weather_pace_info converts
# F -> C internally, so test fixtures below use Fahrenheit values.

def test_neutral_conditions_returns_none():
    # 52°F -> 11.1°C, no dew point data — penalty ~1.3 s/km, below the 2 s/km threshold
    weather = {"temperature": 52}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    assert adj is None
    assert pen is None
    assert desc is None


def test_garmin_fahrenheit_payload_converts_correctly():
    # Real-world regression: Garmin app showed 14°C / dew point 11°C, but the
    # raw activity-weather payload was {"temp": 57, "dewPoint": 52} (°F).
    weather = {"temp": 57, "dewPoint": 52}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    assert desc is not None
    assert "14°C" in desc
    assert "11°C" in desc
    assert "57°C" not in desc
    assert "52°C" not in desc


def test_hot_run_returns_adjusted_pace():
    # 77°F / dew point 64°F == 25°C / dew point ~18°C, with 5:00/km pace
    weather = {"temperature": 77, "dewPoint": 64}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    assert adj is not None
    assert adj < 5.0  # adjusted pace should be faster (easier-equivalent)
    assert pen is not None
    assert pen >= 2.0
    assert "25°C" in desc
    assert "18°C" in desc
    assert "s/km" in desc
    assert "stronger" in desc


def test_no_weather_returns_none():
    adj, pen, desc = weather_pace_info(None, 5.0)
    assert (adj, pen, desc) == (None, None, None)


def test_no_pace_returns_none():
    adj, pen, desc = weather_pace_info({"temperature": 86}, None)
    assert (adj, pen, desc) == (None, None, None)


def test_alternative_key_spellings():
    # Garmin sometimes uses "temp" instead of "temperature"; values in °F.
    # 90°F / 80°F dew point == hot and humid once converted to °C.
    weather = {"temp": 90, "dew_point": 80}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    assert adj is not None
    assert pen is not None


def test_temperature_only_no_dew_point():
    # Hot but dry conditions — temperature key only (90°F == 32.2°C)
    weather = {"temperature": 90}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    assert adj is not None
    assert "dew point" not in desc  # dew point not mentioned when absent


def test_description_omits_dew_point_when_low():
    # 77°F == 25°C temp, 45°F == 7.2°C dew point — below the 10°C threshold,
    # so dew point is not mentioned in the description.
    weather = {"temperature": 77, "dewPoint": 45}
    adj, pen, desc = weather_pace_info(weather, 5.0)
    if desc is not None:
        assert "dew point" not in desc


def test_empty_weather_dict_returns_none():
    adj, pen, desc = weather_pace_info({}, 5.0)
    assert (adj, pen, desc) == (None, None, None)


def test_weather_dict_missing_temp_and_dew_point_keys_returns_none():
    # Non-empty dict, but neither a temp nor a dew-point field is present.
    adj, pen, desc = weather_pace_info({"windSpeed": 12}, 5.0)
    assert (adj, pen, desc) == (None, None, None)


def test_weather_non_numeric_temp_returns_none():
    adj, pen, desc = weather_pace_info({"temperature": "N/A"}, 5.0)
    assert (adj, pen, desc) == (None, None, None)


def test_weather_non_numeric_dew_point_returns_none():
    adj, pen, desc = weather_pace_info({"temperature": 77, "dewPoint": "unknown"}, 5.0)
    assert (adj, pen, desc) == (None, None, None)
