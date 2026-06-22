from datetime import date

from app.utils import (
    calculate_age,
    safe_json_loads,
    parse_activity_charts,
    parse_activity_route,
)


# --- calculate_age ---

def test_calculate_age_none_dob():
    assert calculate_age(None) is None


def test_calculate_age_before_birthday():
    # Reference is the day before the 30th birthday.
    assert calculate_age(date(1990, 6, 15), date(2020, 6, 14)) == 29


def test_calculate_age_on_birthday():
    assert calculate_age(date(1990, 6, 15), date(2020, 6, 15)) == 30


def test_calculate_age_after_birthday():
    assert calculate_age(date(1990, 6, 15), date(2020, 12, 1)) == 30


def test_calculate_age_negative_returns_none():
    # Date of birth in the future yields a negative age -> None.
    assert calculate_age(date(2030, 1, 1), date(2020, 1, 1)) is None


def test_calculate_age_defaults_to_today():
    # Just confirm it runs without an explicit reference and is plausible.
    age = calculate_age(date(2000, 1, 1))
    assert age is not None and age >= 20


# --- safe_json_loads ---

def test_safe_json_loads_valid():
    assert safe_json_loads('{"a": 1}') == {"a": 1}


def test_safe_json_loads_list():
    assert safe_json_loads("[1, 2, 3]") == [1, 2, 3]


def test_safe_json_loads_none():
    assert safe_json_loads(None) is None


def test_safe_json_loads_empty_string():
    assert safe_json_loads("") is None


def test_safe_json_loads_invalid():
    assert safe_json_loads("{not json}") is None


# --- parse_activity_charts ---

def test_parse_charts_empty_or_invalid():
    assert parse_activity_charts(None) == {}
    assert parse_activity_charts("string") == {}
    assert parse_activity_charts({}) == {}
    assert parse_activity_charts({"metricDescriptors": []}) == {}


def _laps(metric_rows, descriptors):
    return {
        "metricDescriptors": descriptors,
        "activityDetailMetrics": [{"metrics": row} for row in metric_rows],
    }


def test_parse_charts_heart_rate_series():
    data = _laps(
        metric_rows=[[120], [130], [140]],
        descriptors=[{"key": "directHeartRate", "metricsIndex": 0}],
    )
    charts = parse_activity_charts(data)
    assert "heart_rate" in charts
    assert charts["heart_rate"]["label"] == "Heart Rate"
    assert charts["heart_rate"]["unit"] == "bpm"
    assert charts["heart_rate"]["data"] == [120, 130, 140]


def test_parse_charts_pace_converted_from_speed():
    # speed 2.5 m/s -> pace 1000/(60*2.5) = 6.67 min/km
    data = _laps(
        metric_rows=[[2.5], [0]],
        descriptors=[{"key": "directSpeed", "metricsIndex": 0}],
    )
    charts = parse_activity_charts(data)
    assert charts["pace"]["data"][0] == round(1000 / (60 * 2.5), 2)
    # Zero speed yields None (avoids divide-by-zero).
    assert charts["pace"]["data"][1] is None


def test_parse_charts_cadence_doubled():
    data = _laps(
        metric_rows=[[85], [90]],
        descriptors=[{"key": "directRunCadence", "metricsIndex": 0}],
    )
    charts = parse_activity_charts(data)
    # Garmin reports half-cadence; values are doubled.
    assert charts["cadence"]["data"] == [170, 180]


def test_parse_charts_all_none_series_dropped():
    data = _laps(
        metric_rows=[[None], [None]],
        descriptors=[{"key": "directHeartRate", "metricsIndex": 0}],
    )
    # A series with no usable values is not emitted.
    assert "heart_rate" not in parse_activity_charts(data)


def test_parse_charts_unknown_metric_ignored():
    data = _laps(
        metric_rows=[[5]],
        descriptors=[{"key": "directSomethingElse", "metricsIndex": 0}],
    )
    assert parse_activity_charts(data) == {}


# --- parse_activity_route ---

def test_parse_route_empty_or_invalid():
    assert parse_activity_route(None) is None
    assert parse_activity_route("string") is None
    assert parse_activity_route({}) is None
    assert parse_activity_route({"metricDescriptors": []}) is None


def test_parse_route_no_gps_columns_returns_none():
    # Indoor activity: streams present but no lat/lng -> no route.
    data = _laps(
        metric_rows=[[120], [130]],
        descriptors=[{"key": "directHeartRate", "metricsIndex": 0}],
    )
    assert parse_activity_route(data) is None


def test_parse_route_points_and_aligned_streams():
    # Columns: lat, lng, HR, speed (m/s), power, elevation.
    data = _laps(
        metric_rows=[
            [40.0, -3.0, 120, 2.5, 200, 650],
            [40.1, -3.1, 140, 3.0, 250, 655],
        ],
        descriptors=[
            {"key": "directLatitude", "metricsIndex": 0},
            {"key": "directLongitude", "metricsIndex": 1},
            {"key": "directHeartRate", "metricsIndex": 2},
            {"key": "directSpeed", "metricsIndex": 3},
            {"key": "directPower", "metricsIndex": 4},
            {"key": "directElevation", "metricsIndex": 5},
        ],
    )
    route = parse_activity_route(data)
    assert route is not None
    assert route["points"] == [[40.0, -3.0], [40.1, -3.1]]
    assert route["hr"] == [120, 140]
    assert route["power"] == [200, 250]
    assert route["elevation"] == [650, 655]
    # speed -> pace (min/km), matching parse_activity_charts conversion.
    assert route["pace"] == [
        round(1000 / (60 * 2.5), 2),
        round(1000 / (60 * 3.0), 2),
    ]


def test_parse_route_skips_invalid_points_and_missing_metrics():
    data = _laps(
        metric_rows=[
            [40.0, -3.0],
            [None, -3.1],   # missing lat -> point is None
        ],
        descriptors=[
            {"key": "directLatitude", "metricsIndex": 0},
            {"key": "directLongitude", "metricsIndex": 1},
        ],
    )
    route = parse_activity_route(data)
    assert route is not None
    assert route["points"] == [[40.0, -3.0], None]
    # No metric streams present -> all None.
    assert route["hr"] is None
    assert route["pace"] is None
    assert route["power"] is None
    assert route["elevation"] is None
