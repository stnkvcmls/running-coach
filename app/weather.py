"""Weather-based pace adjustment helpers.

Derives a heat/humidity pace penalty (sec/km) from stored Garmin activity
weather so the AI coach and activity UI can surface effort-normalized pace.

Model (Ely et al. 2007 + running physiology consensus):
  - Temperature contribution: +0.4 % per °C above 10 °C
  - Dew point contribution:  +0.6 % per °C above 10 °C  (humidity/sweating load)
  - Combined factor ≥ 1.0 — pace is slower by this multiple in hot/humid conditions
  - weather_adjusted_pace = raw_pace / factor  (cool-equivalent effort)

Note: Garmin Connect's activity-weather API returns temp/dewPoint in Fahrenheit
regardless of the account's locale/display-unit setting — the Garmin app/Connect
UI converts to Celsius for display, but the raw field stays °F. We convert to
Celsius before applying the model.
"""

from __future__ import annotations

import json


def parse_weather(weather_json: str | dict | None) -> dict | None:
    """Parse and normalize Activity.weather_json to a plain dict."""
    if weather_json is None:
        return None
    if isinstance(weather_json, dict):
        return weather_json
    try:
        data = json.loads(weather_json)
    except (json.JSONDecodeError, TypeError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def _get_field(data: dict, *keys: str, default=None):
    """Try multiple key spellings and return the first match."""
    for k in keys:
        if k in data and data[k] is not None:
            return data[k]
    return default


def _fahrenheit_to_celsius(value: float) -> float:
    return (value - 32.0) * 5.0 / 9.0


def heat_pace_adjustment(
    temp_c: float | None,
    dew_point_c: float | None,
) -> tuple[float, float]:
    """Return (adjustment_factor, penalty_pct) for given temp and dew point.

    adjustment_factor >= 1.0 means pace is that multiple slower in these conditions.
    penalty_pct is the total percentage slowdown (0 = neutral).
    """
    temp = float(temp_c) if temp_c is not None else 10.0
    dp = float(dew_point_c) if dew_point_c is not None else 5.0

    temp_penalty = max(0.0, (temp - 10.0) * 0.4)
    dp_penalty = max(0.0, (dp - 10.0) * 0.6)
    total_pct = temp_penalty + dp_penalty

    return 1.0 + total_pct / 100.0, total_pct


def extract_temp_dewpoint_c(weather: dict | None) -> tuple[float | None, float | None]:
    """Extract (temp_c, dew_point_c) from a parsed weather dict.

    Garmin Connect's activity-weather endpoint always returns temp/dewPoint in
    Fahrenheit, regardless of the account's display-unit setting (the app
    converts for display) — convert here so callers get °C consistently.
    """
    if not weather:
        return None, None

    raw_temp = _get_field(weather, "temp", "temperature", "apparentTemperature")
    raw_dp = _get_field(weather, "dewPoint", "dew_point")

    try:
        temp = _fahrenheit_to_celsius(float(raw_temp)) if raw_temp is not None else None
        dp = _fahrenheit_to_celsius(float(raw_dp)) if raw_dp is not None else None
    except (TypeError, ValueError):
        return None, None

    return temp, dp


def weather_pace_info(
    weather: dict | None,
    avg_pace_min_km: float | None,
) -> tuple[float | None, float | None, str | None]:
    """Compute weather-adjusted pace from a parsed weather dict and raw avg pace.

    Returns (adjusted_pace_min_km, penalty_sec_per_km, description).
    All three are None when conditions are neutral (< 2 s/km penalty) or data missing.
    """
    if not weather or avg_pace_min_km is None:
        return None, None, None

    temp, dp = extract_temp_dewpoint_c(weather)
    if temp is None and dp is None:
        return None, None, None

    factor, _ = heat_pace_adjustment(temp, dp)

    adjusted_pace = avg_pace_min_km / factor
    penalty_sec = (avg_pace_min_km - adjusted_pace) * 60.0

    if penalty_sec < 2.0:
        return None, None, None

    penalty_sec_rounded = round(penalty_sec)

    temp_str = f"{temp:.0f}°C" if temp is not None else "hot conditions"
    if dp is not None and dp > 10:
        conditions = f"{temp_str} / dew point {dp:.0f}°C"
    else:
        conditions = temp_str

    description = (
        f"{conditions} — ~{penalty_sec_rounded} s/km heat penalty, "
        "effort was stronger than the clock"
    )

    return adjusted_pace, float(penalty_sec_rounded), description
