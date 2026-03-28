import json


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
