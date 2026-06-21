"""Time-in-zone and intensity distribution aggregation.

Computes weekly summaries of time spent in each HR or power zone from
per-activity zone data (hr_zones_json / power_zones_json stored by Garmin
sync). Falls back gracefully to stored zone totals for runs without detail
streams, giving full-history coverage.

The polarization split maps zones 1–2 → easy, zone 3 → moderate,
zones 4–5 → hard, matching the 80/20 polarized training model.
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Activity, ZoneConfig

logger = logging.getLogger(__name__)


def compute_zone_distribution_from_streams(
    streams: dict,
    zone_configs: list[ZoneConfig],
    threshold: float | None,
    metric: str,
) -> dict[int, float]:
    """Classify per-sample stream data into threshold-anchored zones.

    Returns ``{zone_number: seconds}`` using the supplied ZoneConfig list.
    ``metric`` must be a key in ``streams`` (``"hr"`` or ``"speed"``).
    For pace zones the metric is ``"speed"`` in m/s; the ZoneConfig
    boundaries are in min/km so each sample is converted before comparison.
    """
    if not zone_configs or not threshold or threshold <= 0:
        return {}

    time_series = streams.get("time", [])
    value_series = streams.get(metric, [])
    if not time_series or not value_series:
        return {}

    zone_secs: dict[int, float] = {cfg.zone_number: 0.0 for cfg in zone_configs}
    configs_sorted = sorted(zone_configs, key=lambda z: z.zone_number)
    n = len(time_series)

    for i in range(1, n):
        t0 = time_series[i - 1]
        t1 = time_series[i]
        v = value_series[i]
        if not isinstance(t0, (int, float)) or not isinstance(t1, (int, float)):
            continue
        if not isinstance(v, (int, float)):
            continue
        dt = t1 - t0
        if dt <= 0:
            continue

        if metric == "speed":
            if v <= 0:
                continue
            sample_val = (1000.0 / v) / 60.0  # m/s → min/km
        else:
            sample_val = float(v)

        for cfg in configs_sorted:
            above_min = cfg.min_pct is None or sample_val >= threshold * cfg.min_pct / 100
            below_max = cfg.max_pct is None or sample_val < threshold * cfg.max_pct / 100
            if above_min and below_max:
                zone_secs[cfg.zone_number] = zone_secs.get(cfg.zone_number, 0.0) + dt
                break

    return {k: round(v, 1) for k, v in zone_secs.items() if v > 0}


def _parse_garmin_zones(zones_json: str | None) -> dict[int, float]:
    """Parse Garmin's stored zone JSON into {zone_number: seconds}."""
    if not zones_json:
        return {}
    try:
        zones = json.loads(zones_json)
    except (json.JSONDecodeError, TypeError):
        return {}
    if not isinstance(zones, list):
        return {}
    result: dict[int, float] = {}
    for z in zones:
        if not isinstance(z, dict):
            continue
        num = z.get("zoneNumber")
        secs = z.get("secsInZone")
        if isinstance(num, int) and isinstance(secs, (int, float)) and secs > 0:
            result[num] = float(secs)
    return result


def _polarization(zone_secs: dict[int, float]) -> tuple[float | None, float | None, float | None]:
    """Return (easy_pct, moderate_pct, hard_pct) for zones 1–5."""
    total = sum(zone_secs.values())
    if total <= 0:
        return None, None, None
    easy = zone_secs.get(1, 0) + zone_secs.get(2, 0)
    moderate = zone_secs.get(3, 0)
    hard = zone_secs.get(4, 0) + zone_secs.get(5, 0)
    return (
        round(100 * easy / total, 1),
        round(100 * moderate / total, 1),
        round(100 * hard / total, 1),
    )


def aggregate_weekly_intensity(
    db: Session,
    days: int = 90,
    zone_type: str = "hr",
    as_of: date | None = None,
) -> list[dict]:
    """Aggregate per-activity zone data into weekly buckets.

    Uses ``hr_zones_json`` (zone_type="hr") or ``power_zones_json``
    (zone_type="power"). Returns a list of weekly dicts sorted oldest→newest,
    each with ``week_start``, ``zone_seconds``, ``total_seconds``,
    ``easy_pct``, ``moderate_pct``, ``hard_pct``.
    """
    ref = as_of or date.today()
    cutoff = datetime.combine(ref - timedelta(days=days), datetime.min.time())
    ref_dt = datetime.combine(ref + timedelta(days=1), datetime.min.time())

    json_col = Activity.hr_zones_json if zone_type == "hr" else Activity.power_zones_json

    rows = (
        db.query(Activity.started_at, json_col)
        .filter(
            Activity.started_at >= cutoff,
            Activity.started_at < ref_dt,
            json_col.isnot(None),
        )
        .order_by(Activity.started_at.asc())
        .all()
    )

    weeks: dict[date, dict[int, float]] = {}
    for started_at, zones_json in rows:
        if not isinstance(started_at, datetime):
            continue
        act_date = started_at.date()
        week_start = act_date - timedelta(days=act_date.weekday())
        zone_secs = _parse_garmin_zones(zones_json)
        if not zone_secs:
            continue
        if week_start not in weeks:
            weeks[week_start] = {}
        bucket = weeks[week_start]
        for z_num, secs in zone_secs.items():
            bucket[z_num] = bucket.get(z_num, 0.0) + secs

    result = []
    for week_start in sorted(weeks):
        zone_secs = weeks[week_start]
        total = sum(zone_secs.values())
        easy_pct, moderate_pct, hard_pct = _polarization(zone_secs)
        result.append({
            "week_start": week_start,
            "zone_seconds": {str(k): round(v, 1) for k, v in sorted(zone_secs.items())},
            "total_seconds": round(total, 1),
            "easy_pct": easy_pct,
            "moderate_pct": moderate_pct,
            "hard_pct": hard_pct,
        })
    return result


def format_intensity_context(weeks: list[dict], zone_type: str = "hr") -> str:
    """Format weekly intensity distribution for AI coaching context.

    Shows the last 4 weeks so the coach can judge whether training is
    polarized, grey-zone dominated, or high-intensity biased.
    """
    if not weeks:
        return ""
    recent = weeks[-4:]
    lines = [
        f"## Intensity Distribution ({zone_type.upper()} zones, last {len(recent)} weeks)"
    ]
    for w in recent:
        total_min = w["total_seconds"] / 60
        zone_parts = [
            f"Z{k}: {v / 60:.0f}m"
            for k, v in sorted((int(k), v) for k, v in w["zone_seconds"].items())
            if v > 0
        ]
        polar = ""
        if w["easy_pct"] is not None:
            polar = (
                f" | Easy:{w['easy_pct']:.0f}%"
                f" Mod:{w['moderate_pct']:.0f}%"
                f" Hard:{w['hard_pct']:.0f}%"
            )
        week_str = w["week_start"].isoformat() if isinstance(w["week_start"], date) else w["week_start"]
        lines.append(
            f"- Week of {week_str}: {total_min:.0f}min total"
            f" ({', '.join(zone_parts)}){polar}"
        )
    return "\n".join(lines)
