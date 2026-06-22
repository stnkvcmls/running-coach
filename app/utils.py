import json
from datetime import date


def calculate_age(dob: date | None, reference: date | None = None) -> int | None:
    """Return age in whole years from a date of birth, or None if unset."""
    if dob is None:
        return None
    today = reference or date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return years if years >= 0 else None


def safe_json_loads(raw: str | None):
    """Parse a JSON string, returning None on failure."""
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None


def parse_activity_charts(laps_data) -> dict:
    """Extract time-series chart data from activity details (laps_json)."""
    if not laps_data or not isinstance(laps_data, dict):
        return {}

    descriptors = laps_data.get("metricDescriptors", [])
    metrics = laps_data.get("activityDetailMetrics", [])
    if not descriptors or not metrics:
        return {}

    col_map = {}
    for d in descriptors:
        key = d.get("key", "")
        idx = d.get("metricsIndex")
        if idx is not None:
            col_map[key] = idx

    charts = {}
    step = max(1, len(metrics) // 200)
    sampled = metrics[::step]

    series_defs = [
        ("heart_rate", "directHeartRate", "Heart Rate", "bpm"),
        ("elevation", "directElevation", "Elevation", "m"),
        ("pace", "directSpeed", "Pace", "min/km"),
        ("cadence", "directRunCadence", "Cadence", "spm"),
        ("power", "directPower", "Power", "W"),
        ("gct", "directGroundContactTime", "GCT", "ms"),
        ("vert_osc", "directVerticalOscillation", "Vert. Osc.", "cm"),
        ("vert_ratio", "directVerticalRatio", "Vert. Ratio", "%"),
        ("stride", "directStrideLength", "Stride", "m"),
        ("perf_cond", "directPerformanceCondition", "Perf. Cond.", ""),
        ("stamina", "directCurrentStamina", "Stamina", "%"),
    ]

    for chart_key, garmin_key, label, unit in series_defs:
        if garmin_key not in col_map:
            continue
        idx = col_map[garmin_key]
        values = []
        for m in sampled:
            metrics_arr = m.get("metrics", [])
            if idx < len(metrics_arr) and metrics_arr[idx] is not None:
                values.append(metrics_arr[idx])
            else:
                values.append(None)
        if any(v is not None for v in values):
            charts[chart_key] = {"label": label, "unit": unit, "data": values}

    # Convert speed (m/s) to pace (min/km)
    if "pace" in charts:
        charts["pace"]["data"] = [
            round(1000 / (60 * v), 2) if v and v > 0 else None
            for v in charts["pace"]["data"]
        ]

    # Double cadence for running (Garmin reports half-cadence)
    if "cadence" in charts:
        charts["cadence"]["data"] = [
            round(v * 2) if v is not None else None
            for v in charts["cadence"]["data"]
        ]

    return charts


def parse_activity_route(laps_data, points: int = 300) -> dict | None:
    """Extract the GPS route + aligned metric streams from activity details.

    Reads ``directLatitude``/``directLongitude`` from the same
    ``activityDetailMetrics`` matrix that feeds ``parse_activity_charts``, so
    the route points come pre-aligned with the heart-rate / pace / power /
    elevation streams. Returns ``None`` when no GPS columns are present
    (indoor / treadmill activities). The series are downsampled to roughly
    ``points`` samples for a smooth-but-light silhouette.

    Shape::

        {"points": [[lat, lng], ...],
         "hr": [...], "pace": [...], "power": [...], "elevation": [...]}

    Each metric list is aligned 1:1 with ``points``; entries are ``null``
    where the value is missing.
    """
    if not laps_data or not isinstance(laps_data, dict):
        return None

    descriptors = laps_data.get("metricDescriptors", [])
    metrics = laps_data.get("activityDetailMetrics", [])
    if not descriptors or not metrics:
        return None

    col_map = {}
    for d in descriptors:
        key = d.get("key", "")
        idx = d.get("metricsIndex")
        if idx is not None:
            col_map[key] = idx

    lat_idx = col_map.get("directLatitude")
    lng_idx = col_map.get("directLongitude")
    if lat_idx is None or lng_idx is None:
        return None

    step = max(1, len(metrics) // points)
    sampled = metrics[::step]

    def _col(key: str):
        idx = col_map.get(key)
        if idx is None:
            return None
        out = []
        for m in sampled:
            arr = m.get("metrics", [])
            out.append(arr[idx] if idx < len(arr) and arr[idx] is not None else None)
        return out if any(v is not None for v in out) else None

    route_points: list[list[float] | None] = []
    for m in sampled:
        arr = m.get("metrics", [])
        lat = arr[lat_idx] if lat_idx < len(arr) else None
        lng = arr[lng_idx] if lng_idx < len(arr) else None
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
            route_points.append([lat, lng])
        else:
            route_points.append(None)

    if not any(p is not None for p in route_points):
        return None

    hr = _col("directHeartRate")
    power = _col("directPower")
    elevation = _col("directElevation")

    # Convert speed (m/s) -> pace (min/km), matching parse_activity_charts.
    speed = _col("directSpeed")
    pace = None
    if speed is not None:
        pace = [
            round(1000 / (60 * v), 2) if v and v > 0 else None
            for v in speed
        ]

    return {
        "points": route_points,
        "hr": hr,
        "pace": pace,
        "power": power,
        "elevation": elevation,
    }
