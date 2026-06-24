"""Training Load model — CTL / ATL / TSB (the TrainingPeaks PMC).

Derives a daily Fitness/Fatigue/Form series from per-activity Training Stress
Score (TSS). Activities that already carry a power-derived ``training_stress_score``
use it directly; the rest fall back to an estimated load (pace-based rTSS, then
HR-based hrTSS, then a duration-only floor) so non-power runs still contribute.

- **CTL** (Chronic Training Load, "Fitness") — 42-day exponentially-weighted average of TSS.
- **ATL** (Acute Training Load, "Fatigue") — 7-day exponentially-weighted average of TSS.
- **TSB** (Training Stress Balance, "Form") — CTL − ATL.
"""

import json
import logging
import math
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DEFAULT_USER_ID, Activity, AthleteProfile, DailySummary, SyncStatus
from app.schemas import TrainingLoadPoint, TrainingReadiness

logger = logging.getLogger(__name__)

_SERIES_CACHE_KEY = "training_load_series"

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


def estimate_tss(activity: Activity, profile: AthleteProfile | None) -> tuple[float, str]:
    """Return ``(tss, source)`` for one activity.

    Source is one of ``power`` (stored), ``pace``, ``hr``, ``duration``, or
    ``none`` (no usable duration).
    """
    if activity.training_stress_score and activity.training_stress_score > 0:
        return float(activity.training_stress_score), "power"

    duration_hr = (activity.duration_sec or 0) / 3600.0
    if duration_hr <= 0:
        return 0.0, "none"

    # Pace-based rTSS: intensity = threshold_pace / actual_pace (min/km), so a
    # faster (smaller) pace yields a higher intensity factor.
    thr_pace = profile.threshold_pace_min_km if profile else None
    if thr_pace and activity.avg_pace_min_km and activity.avg_pace_min_km > 0:
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

    # Duration-only floor so the session still registers some load.
    return _intensity_to_tss(duration_hr, _DEFAULT_IF), "duration"


def _series_fingerprint(db: Session, user_id: int) -> str:
    """Cheap cache key: activity count + newest sync timestamp + profile update time."""
    count = db.query(func.count(Activity.id)).filter(Activity.user_id == user_id).scalar() or 0
    max_sync = db.query(func.max(Activity.synced_at)).filter(Activity.user_id == user_id).scalar()
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    return "|".join([
        str(count),
        max_sync.isoformat() if max_sync else "",
        profile.updated_at.isoformat() if (profile and profile.updated_at) else "",
    ])


def _load_cached_series(db: Session, user_id: int) -> list[TrainingLoadPoint] | None:
    """Return the cached full series when the fingerprint matches, else None."""
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _SERIES_CACHE_KEY)
        .first()
    )
    if not row or not row.value:
        return None
    try:
        data = json.loads(row.value)
    except (json.JSONDecodeError, TypeError):
        return None
    if data.get("fp") != _series_fingerprint(db, user_id):
        return None
    try:
        return [TrainingLoadPoint(**p) for p in data["series"]]
    except Exception:
        return None


def _save_cached_series(db: Session, series: list[TrainingLoadPoint], user_id: int) -> None:
    """Persist the full series alongside the current fingerprint."""
    payload = json.dumps({
        "fp": _series_fingerprint(db, user_id),
        "series": [p.model_dump(mode="json") for p in series],
    })
    row = (
        db.query(SyncStatus)
        .filter(SyncStatus.user_id == user_id, SyncStatus.key == _SERIES_CACHE_KEY)
        .first()
    )
    if row:
        row.value = payload
        row.updated_at = datetime.now(timezone.utc)
    else:
        db.add(SyncStatus(user_id=user_id, key=_SERIES_CACHE_KEY, value=payload,
                          updated_at=datetime.now(timezone.utc)))
    db.commit()


def _daily_tss(
    db: Session, end_date: date, profile: AthleteProfile | None, user_id: int
) -> dict[date, float]:
    """Sum estimated TSS per calendar day up to and including ``end_date``."""
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time())
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.started_at.isnot(None),
            Activity.started_at < end_dt,
        )
        .all()
    )
    totals: dict[date, float] = defaultdict(float)
    for a in activities:
        day = a.started_at.date() if isinstance(a.started_at, datetime) else a.started_at
        tss, _ = estimate_tss(a, profile)
        if tss > 0:
            totals[day] += tss
    return totals


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


def _compute_full_series(
    db: Session, end_date: date, user_id: int = DEFAULT_USER_ID
) -> list[TrainingLoadPoint]:
    """Build the daily CTL/ATL/TSB/ACWR series from the first activity to ``end_date``.

    Results are memoized in ``SyncStatus`` when ``end_date`` is today; the cache
    is invalidated whenever the activity set or athlete profile changes.
    """
    today = date.today()
    if end_date == today:
        cached = _load_cached_series(db, user_id)
        if cached is not None:
            return cached

    first_started = (
        db.query(func.min(Activity.started_at)).filter(Activity.user_id == user_id).scalar()
    )
    if first_started is None:
        return []
    start_date = first_started.date() if isinstance(first_started, datetime) else first_started
    if start_date > end_date:
        return []

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    daily = _daily_tss(db, end_date, profile, user_id)

    series: list[TrainingLoadPoint] = []
    ctl = 0.0
    atl = 0.0
    day = start_date
    while day <= end_date:
        tss = daily.get(day, 0.0)
        ctl += (tss - ctl) * _CTL_ALPHA
        atl += (tss - atl) * _ATL_ALPHA

        # ACWR: only meaningful when CTL is established (> 1 to avoid divide-by-zero).
        acwr: float | None = round(atl / ctl, 3) if ctl > 1.0 else None

        # Ramp rates: CTL change over the last 7 and 28 days.
        idx = len(series)
        ramp_7d: float | None = None
        ramp_28d: float | None = None
        if idx >= 7:
            ramp_7d = round(ctl - series[idx - 7].ctl, 1)
        if idx >= 28:
            ramp_28d = round(ctl - series[idx - 28].ctl, 1)

        series.append(
            TrainingLoadPoint(
                date=day,
                tss=round(tss, 1),
                ctl=round(ctl, 1),
                atl=round(atl, 1),
                tsb=round(ctl - atl, 1),
                acwr=acwr,
                ramp_rate_7d=ramp_7d,
                ramp_rate_28d=ramp_28d,
                injury_risk=_injury_risk(acwr, ramp_7d),
            )
        )
        day += timedelta(days=1)

    if end_date == today and series:
        try:
            _save_cached_series(db, series, user_id)
        except Exception:
            logger.debug("Training load series cache write failed", exc_info=True)

    return series


def compute_load_series(
    db: Session, end_date: date | None = None, days: int = 90, user_id: int = DEFAULT_USER_ID
) -> list[TrainingLoadPoint]:
    """Return the last ``days`` of the CTL/ATL/TSB series ending at ``end_date``."""
    end_date = end_date or date.today()
    full = _compute_full_series(db, end_date, user_id)
    if days and days > 0:
        return full[-days:]
    return full


def current_load(
    db: Session, as_of: date | None = None, user_id: int = DEFAULT_USER_ID
) -> TrainingLoadPoint | None:
    """Return the most recent CTL/ATL/TSB snapshot as of ``as_of``."""
    full = _compute_full_series(db, as_of or date.today(), user_id)
    return full[-1] if full else None


def _interpret_tsb(tsb: float) -> str:
    """Plain-language reading of Training Stress Balance (form)."""
    if tsb > 15:
        return "very fresh / detraining risk"
    if tsb > 5:
        return "fresh, tapered"
    if tsb >= -10:
        return "neutral / race-ready range"
    if tsb >= -30:
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


def compute_readiness(
    daily: DailySummary | None,
    load_point: TrainingLoadPoint | None,
    recent_rhr: list[int],
) -> TrainingReadiness | None:
    """Compute a composite 0–100 readiness score from wellness and load inputs.

    Components (each 0–100):
    - sleep_component: average of Garmin sleep_score and a duration-based score
    - recovery_component: average of inverted stress and body_battery_high
    - fatigue_component: 100 − ATL (capped 0–100); higher = less fatigued
    - rhr_component: resting HR today vs 7-day average; lower today = better
    - hrv_component: overnight HRV vs personal baseline; higher = better recovered

    Any missing component is excluded from the weighted average so a partial
    data day still yields a meaningful score.
    """
    # Weights — must sum to 1.0
    WEIGHTS = {
        "sleep": 0.25,
        "recovery": 0.25,
        "fatigue": 0.20,
        "rhr": 0.10,
        "hrv": 0.20,
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

    # Weighted composite
    weighted_sum = 0.0
    total_weight = 0.0
    for comp_val, weight in (
        (sleep_component, WEIGHTS["sleep"]),
        (recovery_component, WEIGHTS["recovery"]),
        (fatigue_component, WEIGHTS["fatigue"]),
        (rhr_component, WEIGHTS["rhr"]),
        (hrv_component, WEIGHTS["hrv"]),
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
    )


def _interpret_acwr(acwr: float) -> str:
    if acwr > 1.5:
        return "high injury risk — significant overreaching"
    if acwr > 1.3:
        return "moderate risk — monitor fatigue closely"
    if acwr >= 0.8:
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
    return "## Training Readiness\n" + "\n".join(lines)
