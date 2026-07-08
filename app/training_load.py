"""Training Load model — CTL / ATL / TSB (the TrainingPeaks PMC).

Derives a daily Fitness/Fatigue/Form series from per-activity Training Stress
Score (TSS). Activities that already carry a power-derived ``training_stress_score``
use it directly; the rest fall back to an estimated load (pace-based rTSS, then
HR-based hrTSS, then a duration-only floor) so non-power runs still contribute.

- **CTL** (Chronic Training Load, "Fitness") — 42-day exponentially-weighted average of TSS.
- **ATL** (Acute Training Load, "Fatigue") — 7-day exponentially-weighted average of TSS.
- **TSB** (Training Stress Balance, "Form") — CTL − ATL.

Series are persisted incrementally to ``DailyLoadSeries``: on recompute, only
rows from the first "dirty" date (the earliest newly-synced activity) are deleted
and re-inserted. The EWMA checkpoint for all earlier days is read directly from
the table, so a typical new-activity sync re-processes a handful of days instead
of the full history.
"""

import json
import logging
import math
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    DEFAULT_USER_ID,
    Activity,
    AthleteProfile,
    DailyCheckin,
    DailyLoadSeries,
    DailySummary,
    SyncStatus,
)
from app.schemas import TrainingLoadPoint, TrainingReadiness, classify_acwr, classify_tsb

logger = logging.getLogger(__name__)

# Watermark key: stores max(activity.synced_at) of the last series compute so we
# can find activities added since then without scanning the full table.
_LOAD_WATERMARK_KEY = "training_load_watermark"

CTL_DAYS = 42
ATL_DAYS = 7

# EWMA smoothing constants: alpha = 1 - exp(-1/N), the impulse-response form
# TrainingPeaks uses for the Performance Management Chart.
_CTL_ALPHA = 1 - math.exp(-1 / CTL_DAYS)
_ATL_ALPHA = 1 - math.exp(-1 / ATL_DAYS)

# Intensity assumed for a run with no power, pace, or HR reference available.
_DEFAULT_IF = 0.70
# Cap estimated intensity so a single fluky data point can't explode the load.
_MAX_IF = 1.50


def _intensity_to_tss(duration_hr: float, intensity: float) -> float:
    """TSS for a session of ``duration_hr`` hours at a given intensity factor."""
    intensity = min(intensity, _MAX_IF)
    return duration_hr * intensity ** 2 * 100.0


# Sport categories for load accounting, matched against Garmin's ``typeKey``
# substrings (e.g. "running", "treadmill_running", "road_biking", "strength_training").
# Order matters: first matching category wins.
_SPORT_CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("run", ("run", "treadmill")),
    ("ride", ("cycling", "biking", "bike")),
    ("swim", ("swim",)),
    ("strength", ("strength", "yoga", "pilates")),
]


def sport_category(activity_type: str | None) -> str:
    """Bucket a raw Garmin activity type into a coarse sport category.

    One of ``run``, ``ride``, ``swim``, ``strength``, or ``other``.
    """
    if not activity_type:
        return "other"
    t = activity_type.lower()
    for category, keywords in _SPORT_CATEGORY_RULES:
        if any(k in t for k in keywords):
            return category
    return "other"


def is_run(activity_type: str | None) -> bool:
    return sport_category(activity_type) == "run"


def estimate_tss(activity: Activity, profile: AthleteProfile | None) -> tuple[float, str]:
    """Return ``(tss, source)`` for one activity.

    Source is one of ``power`` (stored), ``pace``, ``hr``, ``srpe``, ``duration``,
    or ``none`` (no usable duration).
    """
    if activity.training_stress_score and activity.training_stress_score > 0:
        return float(activity.training_stress_score), "power"

    duration_hr = (activity.duration_sec or 0) / 3600.0
    if duration_hr <= 0:
        return 0.0, "none"

    # Pace-based rTSS assumes a running gait: intensity = threshold_pace / actual
    # pace (min/km). ``avg_pace_min_km`` is a generic distance/duration ratio
    # computed for every synced activity (see garmin_sync._extract_activity_fields),
    # so it must be gated to runs — otherwise a bike ride's much faster
    # distance/time ratio reads as a sprint and wildly overstates its TSS.
    thr_pace = profile.threshold_pace_min_km if profile else None
    if (
        is_run(activity.activity_type)
        and thr_pace
        and activity.avg_pace_min_km
        and activity.avg_pace_min_km > 0
    ):
        intensity = thr_pace / activity.avg_pace_min_km
        return _intensity_to_tss(duration_hr, intensity), "pace"

    # HR-based hrTSS: intensity = avg_hr / threshold_hr. Fall back to ~90% of
    # max HR as a threshold estimate when an explicit threshold isn't set.
    thr_hr = None
    if profile:
        thr_hr = profile.threshold_hr or (round(profile.max_hr * 0.9) if profile.max_hr else None)
    if thr_hr and activity.avg_hr and activity.avg_hr > 0:
        intensity = activity.avg_hr / thr_hr
        return _intensity_to_tss(duration_hr, intensity), "hr"

    # sRPE-based load (Foster): the athlete's own effort rating stands in for
    # an intensity factor (RPE 10/10 ~= max effort ~= IF 1.0), the same scale
    # the duration floor below assumes a fixed RPE-7-equivalent for.
    if activity.rpe and activity.rpe > 0:
        intensity = activity.rpe / 10.0
        return _intensity_to_tss(duration_hr, intensity), "srpe"

    # Duration-only floor so the session still registers some load.
    return _intensity_to_tss(duration_hr, _DEFAULT_IF), "duration"


# ---------------------------------------------------------------------------
# Watermark helpers (dirty-date detection)
# ---------------------------------------------------------------------------

def _get_load_watermark(db: Session, user_id: int) -> datetime | None:
    """Return the synced_at watermark from the last series compute, or None."""
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _LOAD_WATERMARK_KEY)
        .first()
    )
    if not row or not row.value:
        return None
    try:
        return datetime.fromisoformat(row.value)
    except (ValueError, TypeError):
        return None


def _set_load_watermark(db: Session, watermark: datetime | None, user_id: int) -> None:
    """Persist the watermark (called after a series compute completes)."""
    value = watermark.isoformat() if watermark else ""
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _LOAD_WATERMARK_KEY)
        .first()
    )
    if row:
        row.value = value
        row.updated_at = datetime.now(timezone.utc)
    else:
        db.add(SyncStatus(
            user_id=user_id,
            key=_LOAD_WATERMARK_KEY,
            value=value,
            updated_at=datetime.now(timezone.utc),
        ))


def _find_dirty_date(db: Session, user_id: int, watermark: datetime | None) -> date | None:
    """Return the earliest start date of activities synced after ``watermark``.

    ``None`` means either there is no watermark yet (first compute) or no
    activities were added since the last compute.
    """
    if watermark is None:
        return None
    result = (
        db.query(func.min(Activity.started_at))
        .filter(
            Activity.user_id == user_id,
            Activity.started_at.isnot(None),
            Activity.synced_at > watermark,
        )
        .scalar()
    )
    if result is None:
        return None
    return result.date() if isinstance(result, datetime) else result


# ---------------------------------------------------------------------------
# DB-backed series read / write
# ---------------------------------------------------------------------------

def _load_series_points(
    db: Session,
    user_id: int,
    end_date: date,
    start_date: date | None = None,
) -> list[TrainingLoadPoint]:
    """Load persisted series rows as ``TrainingLoadPoint`` objects."""
    query = (
        db.query(DailyLoadSeries)
        .filter(DailyLoadSeries.user_id == user_id, DailyLoadSeries.date <= end_date)
    )
    if start_date is not None:
        query = query.filter(DailyLoadSeries.date >= start_date)
    rows = query.order_by(DailyLoadSeries.date).all()
    return [
        TrainingLoadPoint(
            date=row.date,
            tss=row.tss,
            ctl=row.ctl,
            atl=row.atl,
            tsb=row.tsb,
            acwr=row.acwr,
            ramp_rate_7d=row.ramp_rate_7d,
            ramp_rate_28d=row.ramp_rate_28d,
            injury_risk=row.injury_risk or "low",
            sport_breakdown=json.loads(row.sport_breakdown_json) if row.sport_breakdown_json else None,
        )
        for row in rows
    ]


# ---------------------------------------------------------------------------
# TSS aggregation
# ---------------------------------------------------------------------------

def _daily_tss_range(
    db: Session,
    start_date: date,
    end_date: date,
    profile: AthleteProfile | None,
    user_id: int,
) -> tuple[dict[date, float], dict[date, dict[str, float]]]:
    """Sum estimated TSS per calendar day in [start_date, end_date].

    Returns ``(totals, sport_totals)`` where ``sport_totals`` breaks each day's
    total down by ``sport_category`` (e.g. ``{"run": 62.0, "ride": 18.0}``).
    """
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time())
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at.isnot(None),
            Activity.started_at >= start_dt,
            Activity.started_at < end_dt,
        )
        .all()
    )
    totals: dict[date, float] = defaultdict(float)
    sport_totals: dict[date, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for a in activities:
        day = a.started_at.date() if isinstance(a.started_at, datetime) else a.started_at
        tss, _ = estimate_tss(a, profile)
        if tss > 0:
            totals[day] += tss
            sport_totals[day][sport_category(a.activity_type)] += tss
    return totals, sport_totals


# ---------------------------------------------------------------------------
# Injury risk
# ---------------------------------------------------------------------------

def _injury_risk(acwr: float | None, ramp_7d: float | None) -> str:
    """Classify injury risk from ACWR and short-term ramp rate."""
    if acwr is not None and acwr > 1.5:
        return "high"
    if ramp_7d is not None and ramp_7d > 10:
        return "high"
    if acwr is not None and acwr > 1.3:
        return "moderate"
    if ramp_7d is not None and ramp_7d > 7:
        return "moderate"
    return "low"


# ---------------------------------------------------------------------------
# Incremental series compute
# ---------------------------------------------------------------------------

def _ensure_series_current(
    db: Session, end_date: date, user_id: int = DEFAULT_USER_ID
) -> None:
    """Ensure ``DailyLoadSeries`` is populated through at least today.

    Incremental strategy:
    - No persisted rows: full compute from first activity.
    - Dirty date after last row: extend forward from the last row's CTL/ATL.
    - Dirty date at/before last row (backfilled activity): delete from dirty date,
      load CTL/ATL from the preceding row, recompute only from there.
    - No dirty activities and series already covers today: nothing to do.
    """
    today = date.today()
    compute_to = today if end_date <= today else end_date

    watermark = _get_load_watermark(db, user_id)
    dirty_date = _find_dirty_date(db, user_id, watermark)

    last_row = (
        db.query(DailyLoadSeries)
        .filter(DailyLoadSeries.user_id == user_id)
        .order_by(DailyLoadSeries.date.desc())
        .first()
    )

    # Already up to date with no new activities.
    if last_row is not None and dirty_date is None and last_row.date >= compute_to:
        return

    # Determine the recompute start and EWMA seed.
    if last_row is None:
        # No persisted data: must build from the user's very first activity.
        first_started = (
            db.query(func.min(Activity.started_at))
            .filter(Activity.user_id == user_id)
            .scalar()
        )
        if first_started is None:
            return  # No activities yet.
        recompute_from = (
            first_started.date() if isinstance(first_started, datetime) else first_started
        )
        prev_ctl, prev_atl = 0.0, 0.0
    elif dirty_date is not None and dirty_date <= last_row.date:
        # A past activity was added/changed — recompute from dirty_date.
        recompute_from = dirty_date
        prev_row = (
            db.query(DailyLoadSeries)
            .filter(
                DailyLoadSeries.user_id == user_id,
                DailyLoadSeries.date < recompute_from,
            )
            .order_by(DailyLoadSeries.date.desc())
            .first()
        )
        prev_ctl = prev_row.ctl if prev_row else 0.0
        prev_atl = prev_row.atl if prev_row else 0.0
    else:
        # Extend forward: new activities are all after the series end, or the
        # series doesn't reach compute_to yet.
        recompute_from = (
            (last_row.date + timedelta(days=1)) if last_row else compute_to
        )
        prev_ctl = last_row.ctl if last_row else 0.0
        prev_atl = last_row.atl if last_row else 0.0

    if recompute_from > compute_to:
        return  # Nothing to compute.

    # Delete stale rows and query only the needed TSS range.
    db.query(DailyLoadSeries).filter(
        DailyLoadSeries.user_id == user_id,
        DailyLoadSeries.date >= recompute_from,
    ).delete()
    db.commit()

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    daily_tss_map, daily_sport_map = _daily_tss_range(db, recompute_from, compute_to, profile, user_id)

    # Load the 28-day ramp-rate lookback from the persisted table.
    lookback_start = recompute_from - timedelta(days=28)
    history = _load_series_points(
        db, user_id, recompute_from - timedelta(days=1), start_date=lookback_start
    )

    now_ts = datetime.now(timezone.utc)
    new_db_rows: list[DailyLoadSeries] = []
    new_points: list[TrainingLoadPoint] = []
    ctl, atl = prev_ctl, prev_atl
    day = recompute_from
    while day <= compute_to:
        tss = daily_tss_map.get(day, 0.0)
        ctl += (tss - ctl) * _CTL_ALPHA
        atl += (tss - atl) * _ATL_ALPHA

        all_before = history + new_points
        idx = len(all_before)
        acwr: float | None = round(atl / ctl, 3) if ctl > 1.0 else None
        ramp_7d: float | None = round(ctl - all_before[idx - 7].ctl, 1) if idx >= 7 else None
        ramp_28d: float | None = (
            round(ctl - all_before[idx - 28].ctl, 1) if idx >= 28 else None
        )
        risk = _injury_risk(acwr, ramp_7d)
        sport_breakdown = {
            sport: round(val, 1) for sport, val in daily_sport_map.get(day, {}).items()
        } or None
        sport_breakdown_json = json.dumps(sport_breakdown) if sport_breakdown else None

        new_points.append(
            TrainingLoadPoint(
                date=day,
                tss=round(tss, 1),
                ctl=round(ctl, 1),
                atl=round(atl, 1),
                tsb=round(ctl - atl, 1),
                acwr=acwr,
                ramp_rate_7d=ramp_7d,
                ramp_rate_28d=ramp_28d,
                injury_risk=risk,
                sport_breakdown=sport_breakdown,
            )
        )
        new_db_rows.append(
            DailyLoadSeries(
                user_id=user_id,
                date=day,
                tss=round(tss, 1),
                ctl=round(ctl, 1),
                atl=round(atl, 1),
                tsb=round(ctl - atl, 1),
                acwr=acwr,
                ramp_rate_7d=ramp_7d,
                ramp_rate_28d=ramp_28d,
                injury_risk=risk,
                sport_breakdown_json=sport_breakdown_json,
                computed_at=now_ts,
            )
        )
        day += timedelta(days=1)

    db.bulk_save_objects(new_db_rows)

    max_synced = (
        db.query(func.max(Activity.synced_at))
        .filter(Activity.user_id == user_id)
        .scalar()
    )
    _set_load_watermark(db, max_synced, user_id)
    db.commit()


def _compute_full_series(
    db: Session, end_date: date, user_id: int = DEFAULT_USER_ID
) -> list[TrainingLoadPoint]:
    """Return the full series up to ``end_date``, computing/extending as needed."""
    _ensure_series_current(db, end_date, user_id)
    return _load_series_points(db, user_id, end_date)


def compute_load_series(
    db: Session, end_date: date | None = None, days: int = 90, user_id: int = DEFAULT_USER_ID
) -> list[TrainingLoadPoint]:
    """Return the last ``days`` of the CTL/ATL/TSB series ending at ``end_date``."""
    end_date = end_date or date.today()
    _ensure_series_current(db, end_date, user_id)
    if days and days > 0:
        start_date = end_date - timedelta(days=days - 1)
        return _load_series_points(db, user_id, end_date, start_date=start_date)
    return _load_series_points(db, user_id, end_date)


def current_load(
    db: Session, as_of: date | None = None, user_id: int = DEFAULT_USER_ID
) -> TrainingLoadPoint | None:
    """Return the most recent CTL/ATL/TSB snapshot as of ``as_of``."""
    as_of = as_of or date.today()
    _ensure_series_current(db, as_of, user_id)
    points = _load_series_points(db, user_id, as_of, start_date=as_of)
    if points:
        return points[-1]
    # No row exactly on as_of — return the nearest preceding row.
    all_points = _load_series_points(db, user_id, as_of)
    return all_points[-1] if all_points else None


def _interpret_tsb(tsb: float) -> str:
    """Plain-language reading of Training Stress Balance (form)."""
    zone, _label = classify_tsb(tsb)
    if zone == "very_fresh":
        return "very fresh / detraining risk"
    if zone == "fresh":
        return "fresh, tapered"
    if zone == "neutral":
        return "neutral / race-ready range"
    if zone == "productive_fatigue":
        return "productive training fatigue"
    return "high fatigue — overreaching risk"


def _readiness_label(score: int) -> str:
    if score >= 86:
        return "Excellent"
    if score >= 71:
        return "Very Good"
    if score >= 51:
        return "Good"
    if score >= 31:
        return "Fair"
    return "Low"


# Fallback scores when no personal HRV baseline is available, keyed on Garmin's
# overnight HRV status enum.
_HRV_STATUS_SCORES = {
    "BALANCED": 85,
    "UNBALANCED": 50,
    "LOW": 30,
    "POOR": 20,
}


def _hrv_component(daily: DailySummary | None) -> int | None:
    """Score overnight HRV 0–100 against the athlete's personal baseline.

    Prefers last-night average vs the 7-day baseline (continuous), falling back
    to Garmin's HRV status enum when no baseline is available.
    """
    if daily is None or daily.hrv_avg is None:
        return None
    baseline = daily.hrv_weekly_avg
    if baseline:
        # ratio 1.0 (at baseline) → 75 ("good"); +20% → 125→cap 100; −20% → 25
        ratio = daily.hrv_avg / baseline
        return int(min(100, max(0, 75 + (ratio - 1.0) * 250)))
    if daily.hrv_status:
        return _HRV_STATUS_SCORES.get(daily.hrv_status.upper())
    return None


def _subjective_component(checkin: DailyCheckin | None) -> int | None:
    """Score the athlete's daily check-in 0–100 (average of soreness/energy/mood).

    Each tap is 1 (worst) - 5 (best), so higher is always better; a 1-5 scale
    maps onto 0-100 as ``(value - 1) / 4 * 100``.
    """
    if checkin is None:
        return None
    taps = [v for v in (checkin.soreness, checkin.energy, checkin.mood) if v is not None]
    if not taps:
        return None
    avg = sum(taps) / len(taps)
    return int(round((avg - 1) / 4 * 100))


def compute_readiness(
    daily: DailySummary | None,
    load_point: TrainingLoadPoint | None,
    recent_rhr: list[int],
    checkin: DailyCheckin | None = None,
) -> TrainingReadiness | None:
    """Compute a composite 0–100 readiness score from wellness and load inputs.

    Components (each 0–100):
    - sleep_component: average of Garmin sleep_score and a duration-based score
    - recovery_component: average of inverted stress and body_battery_high
    - fatigue_component: 100 − ATL (capped 0–100); higher = less fatigued
    - rhr_component: resting HR today vs 7-day average; lower today = better
    - hrv_component: overnight HRV vs personal baseline; higher = better recovered
    - subjective_component: the athlete's own daily check-in (soreness/energy/mood)

    Any missing component is excluded from the weighted average so a partial
    data day still yields a meaningful score.
    """
    # Weights — sum to 1.0 when every component is present; missing components
    # are excluded and the remainder is renormalized (see total_weight below).
    WEIGHTS = {
        "sleep": 0.25,
        "recovery": 0.25,
        "fatigue": 0.20,
        "rhr": 0.10,
        "hrv": 0.20,
        "subjective": 0.20,
    }

    # Sleep component
    sleep_scores: list[int] = []
    if daily and daily.sleep_score is not None:
        sleep_scores.append(int(min(100, max(0, daily.sleep_score))))
    if daily and daily.sleep_seconds is not None:
        hours = daily.sleep_seconds / 3600.0
        # 5 h or below → 0, 8 h → 100, linear
        dur_score = int(min(100, max(0, (hours - 5.0) / 3.0 * 100)))
        sleep_scores.append(dur_score)
    sleep_component = int(sum(sleep_scores) / len(sleep_scores)) if sleep_scores else None

    # Recovery component (stress inverted + body battery)
    recovery_scores: list[int] = []
    if daily and daily.stress_avg is not None:
        recovery_scores.append(int(min(100, max(0, 100 - daily.stress_avg))))
    if daily and daily.body_battery_high is not None:
        recovery_scores.append(int(min(100, max(0, daily.body_battery_high))))
    recovery_component = (
        int(sum(recovery_scores) / len(recovery_scores)) if recovery_scores else None
    )

    # Fatigue component (ATL-based)
    fatigue_component = (
        int(min(100, max(0, 100 - load_point.atl))) if load_point is not None else None
    )

    # RHR trend component
    rhr_component = None
    if daily and daily.resting_hr and recent_rhr:
        avg_rhr = sum(recent_rhr) / len(recent_rhr)
        delta = daily.resting_hr - avg_rhr  # positive = elevated (bad)
        # delta −5 → 100 pts, delta 0 → 75 pts, delta +10 → 0 pts
        rhr_component = int(min(100, max(0, 75 - delta * 7.5)))

    # HRV component — last-night HRV vs personal baseline (Garmin's status factor)
    hrv_component = _hrv_component(daily)

    # Subjective component — the athlete's own daily check-in
    subjective_component = _subjective_component(checkin)

    # Weighted composite
    weighted_sum = 0.0
    total_weight = 0.0
    for comp_val, weight in (
        (sleep_component, WEIGHTS["sleep"]),
        (recovery_component, WEIGHTS["recovery"]),
        (fatigue_component, WEIGHTS["fatigue"]),
        (rhr_component, WEIGHTS["rhr"]),
        (hrv_component, WEIGHTS["hrv"]),
        (subjective_component, WEIGHTS["subjective"]),
    ):
        if comp_val is not None:
            weighted_sum += comp_val * weight
            total_weight += weight

    if total_weight == 0.0:
        return None

    score = int(round(weighted_sum / total_weight))
    return TrainingReadiness(
        score=score,
        label=_readiness_label(score),
        sleep_component=sleep_component,
        recovery_component=recovery_component,
        fatigue_component=fatigue_component,
        rhr_component=rhr_component,
        hrv_component=hrv_component,
        subjective_component=subjective_component,
    )


def _interpret_acwr(acwr: float) -> str:
    zone, _label, _recommendation = classify_acwr(acwr)
    if zone == "overreaching":
        return (
            "high injury risk — significant overreaching"
            if acwr > 1.5
            else "moderate risk — monitor fatigue closely"
        )
    if zone == "productive":
        return "sweet spot — optimal training zone"
    return "low / detraining risk"


def format_training_load_context(point: TrainingLoadPoint | None) -> str:
    """Render the current training load as a markdown ``## Training Load`` section."""
    if point is None:
        return ""
    lines = [
        "## Training Load",
        f"- Fitness (CTL, 42d): {point.ctl:.0f}",
        f"- Fatigue (ATL, 7d): {point.atl:.0f}",
        f"- Form (TSB = CTL − ATL): {point.tsb:+.0f} ({_interpret_tsb(point.tsb)})",
    ]
    if point.acwr is not None:
        lines.append(
            f"- ACWR (ATL/CTL): {point.acwr:.2f} — {_interpret_acwr(point.acwr)}"
        )
    if point.ramp_rate_7d is not None:
        lines.append(f"- Ramp rate (7d CTL change): {point.ramp_rate_7d:+.1f}")
    if point.ramp_rate_28d is not None:
        lines.append(f"- Ramp rate (28d CTL change): {point.ramp_rate_28d:+.1f}")
    if point.injury_risk:
        lines.append(f"- Injury risk: {point.injury_risk}")
    if point.injury_risk == "high":
        lines.append(
            "- **Load caution (mandatory)**: injury risk is HIGH — do not prescribe "
            "or encourage hard/interval/tempo/long efforts until ACWR falls back "
            "under 1.3; prioritize easy running and recovery."
        )
    if point.rsb_zone_label and point.rsb_recommendation:
        lines.append(f"- Running Stress Balance: {point.rsb_zone_label}. {point.rsb_recommendation}")
    return "\n".join(lines)


def format_readiness_context(readiness: TrainingReadiness | None) -> str:
    """Render the readiness score as a markdown ``## Training Readiness`` section."""
    if readiness is None:
        return ""
    lines = [f"- Score: {readiness.score}/100 ({readiness.label})"]
    if readiness.sleep_component is not None:
        lines.append(f"- Sleep: {readiness.sleep_component}/100")
    if readiness.recovery_component is not None:
        lines.append(f"- Recovery (stress/body battery): {readiness.recovery_component}/100")
    if readiness.fatigue_component is not None:
        lines.append(f"- Freshness (fatigue): {readiness.fatigue_component}/100")
    if readiness.rhr_component is not None:
        lines.append(f"- Resting HR trend: {readiness.rhr_component}/100")
    if readiness.hrv_component is not None:
        lines.append(f"- HRV (vs baseline): {readiness.hrv_component}/100")
    if readiness.subjective_component is not None:
        lines.append(f"- How the athlete says they feel (check-in): {readiness.subjective_component}/100")
    return "## Training Readiness\n" + "\n".join(lines)
