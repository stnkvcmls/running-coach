"""Threshold / Critical Power auto-estimation.

Derives the athlete's functional thresholds from recent training history so the
profile (and the threshold-anchored zones built on it, see ``app/api.py`` zone
configs) can stay current without manual entry — the Stryd "auto-calculated
Critical Power" idea adapted to the data this app already stores per activity.

Three estimates are produced:

- **Critical Power (CP)** and **W'** (anaerobic work capacity) via the
  2-parameter hyperbolic power-duration model ``P(t) = CP + W'/t``. For running,
  CP is treated as the functional threshold power (FTP).
- **Threshold pace** via the analogous critical-velocity model
  ``v(t) = CV + D'/t`` on the speed-duration frontier; CV converts to min/km.
- **Threshold HR (LTHR)** from sustained hard efforts, falling back to a fixed
  fraction of the highest observed max HR.

Each estimate is fit over a *frontier* — the best (max power / max speed) effort
in each duration bin — so easy runs don't drag the fit down, and every estimate
reports a confidence level and the sample size behind it. When there isn't enough
spread of efforts to fit a model, the value is ``None`` rather than a bad guess.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Activity, AthleteProfile

# Lookback window for the analysis. 90 days keeps the estimate responsive to
# current fitness (the same window the training-load chart defaults to).
DEFAULT_LOOKBACK_DAYS = 90

# Duration bins (seconds) used to build the power/velocity-duration frontier.
# A run is assigned to the bin whose range contains its duration, and only the
# single highest-output run in each bin contributes to the fit.
_DURATION_BINS: list[tuple[float, float]] = [
    (300, 600),     # 5–10 min
    (600, 1200),    # 10–20 min
    (1200, 1800),   # 20–30 min
    (1800, 3000),   # 30–50 min
    (3000, 4800),   # 50–80 min
    (4800, 7200),   # 80–120 min
    (7200, 1e9),    # 2 h+
]

# LTHR heuristics.
_LTHR_MAX_HR_FRACTION = 0.90          # fallback: LTHR ≈ 90% of max HR
_HARD_EFFORT_HR_FRACTION = 0.85       # an effort counts as "hard" above this × max HR
_HARD_EFFORT_MIN_SEC = 20 * 60        # …and lasting at least 20 minutes


@dataclass
class FieldEstimate:
    """One estimated threshold value with provenance."""

    value: float | None
    method: str | None
    confidence: str | None      # "low" | "medium" | "high"
    sample_size: int


def _empty() -> FieldEstimate:
    return FieldEstimate(value=None, method=None, confidence=None, sample_size=0)


@dataclass
class ThresholdEstimate:
    """Full estimation result."""

    critical_power: FieldEstimate
    w_prime: float | None
    threshold_pace_min_km: FieldEstimate
    threshold_hr: FieldEstimate
    max_hr: FieldEstimate
    lookback_days: int
    activities_analyzed: int


# ---------------------------------------------------------------------------
# Math helpers
# ---------------------------------------------------------------------------

def _linear_fit(points: list[tuple[float, float]]) -> tuple[float, float] | None:
    """Ordinary least-squares ``y = slope·x + intercept``.

    Returns ``(slope, intercept)`` or ``None`` if the x values have no spread.
    """
    n = len(points)
    if n < 2:
        return None
    sx = sum(x for x, _ in points)
    sy = sum(y for _, y in points)
    sxx = sum(x * x for x, _ in points)
    sxy = sum(x * y for x, y in points)
    denom = n * sxx - sx * sx
    if denom == 0:
        return None
    slope = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n
    return slope, intercept


def _confidence(n_bins: int, duration_ratio: float) -> str:
    """Qualitative confidence from frontier coverage.

    More bins spanning a wider duration range → a better-conditioned fit.
    """
    if n_bins >= 4 and duration_ratio >= 4.0:
        return "high"
    if n_bins >= 3:
        return "medium"
    return "low"


def _build_frontier(
    samples: list[tuple[float, float]]
) -> list[tuple[float, float]]:
    """Reduce raw ``(duration_sec, output)`` samples to a per-bin best frontier.

    For each duration bin, keep only the sample with the highest output and use
    that sample's actual duration. Bins with no samples are skipped.
    """
    best: dict[int, tuple[float, float]] = {}
    for duration, output in samples:
        for i, (lo, hi) in enumerate(_DURATION_BINS):
            if lo <= duration < hi:
                if i not in best or output > best[i][1]:
                    best[i] = (duration, output)
                break
    return [best[i] for i in sorted(best)]


def _fit_hyperbolic(
    frontier: list[tuple[float, float]]
) -> tuple[float, float, str] | None:
    """Fit ``output(t) = asymptote + work/t`` to a duration frontier.

    Regresses output against ``1/t``: slope = ``work`` (W' or D'), intercept =
    the asymptote (CP or CV). Returns ``(asymptote, work, confidence)`` or
    ``None`` when the fit is degenerate or non-physical.
    """
    if len(frontier) < 2:
        return None
    fit = _linear_fit([(1.0 / t, out) for t, out in frontier])
    if fit is None:
        return None
    work, asymptote = fit
    # Non-physical: asymptote must be positive and work capacity non-negative
    # (output should fall, not rise, with duration).
    if asymptote <= 0 or work < 0:
        return None
    durations = [t for t, _ in frontier]
    duration_ratio = max(durations) / min(durations) if min(durations) > 0 else 1.0
    return asymptote, work, _confidence(len(frontier), duration_ratio)


# ---------------------------------------------------------------------------
# Individual estimates
# ---------------------------------------------------------------------------

def _estimate_critical_power(
    activities: list[Activity],
) -> tuple[FieldEstimate, float | None]:
    """Estimate Critical Power (W) and W' (J) from avg power vs duration."""
    samples = [
        (float(a.duration_sec), float(a.avg_power))
        for a in activities
        if a.duration_sec and a.duration_sec > 0 and a.avg_power and a.avg_power > 0
    ]
    frontier = _build_frontier(samples)
    fit = _fit_hyperbolic(frontier)
    if fit is None:
        return _empty(), None
    cp, w_prime, confidence = fit
    return (
        FieldEstimate(
            value=round(cp, 0),
            method="critical_power",
            confidence=confidence,
            sample_size=len(frontier),
        ),
        round(w_prime, 0),
    )


def _estimate_threshold_pace(activities: list[Activity]) -> FieldEstimate:
    """Estimate threshold pace (min/km) via the critical-velocity model."""
    samples: list[tuple[float, float]] = []
    for a in activities:
        if not (a.duration_sec and a.duration_sec > 0):
            continue
        speed = None
        if a.avg_speed and a.avg_speed > 0:
            speed = float(a.avg_speed)
        elif a.distance_m and a.distance_m > 0:
            speed = float(a.distance_m) / float(a.duration_sec)
        if speed:
            samples.append((float(a.duration_sec), speed))

    frontier = _build_frontier(samples)
    fit = _fit_hyperbolic(frontier)
    if fit is None:
        return _empty()
    cv, _d_prime, confidence = fit  # cv in m/s
    pace_min_km = (1000.0 / cv) / 60.0
    return FieldEstimate(
        value=round(pace_min_km, 2),
        method="critical_velocity",
        confidence=confidence,
        sample_size=len(frontier),
    )


def _estimate_max_hr(activities: list[Activity]) -> FieldEstimate:
    """Highest reliably observed max HR across recent activities."""
    maxes = [int(a.max_hr) for a in activities if a.max_hr and a.max_hr > 0]
    if not maxes:
        return _empty()
    return FieldEstimate(
        value=float(max(maxes)),
        method="observed_max",
        confidence="high" if len(maxes) >= 5 else "medium",
        sample_size=len(maxes),
    )


def _estimate_threshold_hr(
    activities: list[Activity], max_hr: float | None
) -> FieldEstimate:
    """Estimate LTHR from sustained hard efforts, else a fraction of max HR."""
    if max_hr and max_hr > 0:
        hard = [
            int(a.avg_hr)
            for a in activities
            if a.avg_hr
            and a.avg_hr > 0
            and a.duration_sec
            and a.duration_sec >= _HARD_EFFORT_MIN_SEC
            and a.avg_hr >= max_hr * _HARD_EFFORT_HR_FRACTION
        ]
        if hard:
            hard.sort()
            mid = len(hard) // 2
            median = hard[mid] if len(hard) % 2 else (hard[mid - 1] + hard[mid]) / 2
            return FieldEstimate(
                value=round(median, 0),
                method="sustained_effort",
                confidence="high" if len(hard) >= 3 else "medium",
                sample_size=len(hard),
            )
        # Fallback: fraction of observed max HR.
        return FieldEstimate(
            value=round(max_hr * _LTHR_MAX_HR_FRACTION, 0),
            method="pct_max_hr",
            confidence="low",
            sample_size=0,
        )
    return _empty()


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def estimate_thresholds(
    db: Session, lookback_days: int = DEFAULT_LOOKBACK_DAYS
) -> ThresholdEstimate:
    """Compute threshold estimates from the last ``lookback_days`` of activities."""
    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    activities = (
        db.query(Activity)
        .filter(Activity.started_at.isnot(None), Activity.started_at >= cutoff)
        .all()
    )

    cp, w_prime = _estimate_critical_power(activities)
    pace = _estimate_threshold_pace(activities)
    max_hr = _estimate_max_hr(activities)
    thr_hr = _estimate_threshold_hr(activities, max_hr.value)

    return ThresholdEstimate(
        critical_power=cp,
        w_prime=w_prime,
        threshold_pace_min_km=pace,
        threshold_hr=thr_hr,
        max_hr=max_hr,
        lookback_days=lookback_days,
        activities_analyzed=len(activities),
    )


def apply_estimate_to_profile(
    profile: AthleteProfile,
    estimate: ThresholdEstimate,
    fields: list[str] | None = None,
) -> list[str]:
    """Write estimated values onto ``profile`` in place.

    ``fields`` limits which thresholds are applied (any of
    ``threshold_power``, ``threshold_pace_min_km``, ``threshold_hr``,
    ``max_hr``); when ``None`` every available estimate is applied. Returns the
    list of field names actually updated.
    """
    candidates = {
        "threshold_power": (estimate.critical_power.value, int),
        "threshold_pace_min_km": (estimate.threshold_pace_min_km.value, float),
        "threshold_hr": (estimate.threshold_hr.value, int),
        "max_hr": (estimate.max_hr.value, int),
    }
    applied: list[str] = []
    for name, (value, caster) in candidates.items():
        if value is None:
            continue
        if fields is not None and name not in fields:
            continue
        setattr(profile, name, caster(value))
        applied.append(name)
    return applied


# ---------------------------------------------------------------------------
# AI context
# ---------------------------------------------------------------------------

def _format_pace(pace_min_km: float) -> str:
    p_min = int(pace_min_km)
    p_sec = int(round((pace_min_km - p_min) * 60))
    if p_sec == 60:
        p_min += 1
        p_sec = 0
    return f"{p_min}:{p_sec:02d}/km"


def format_threshold_estimate_context(
    estimate: ThresholdEstimate, profile: AthleteProfile | None
) -> str:
    """Render auto-derived thresholds the athlete hasn't set, as a markdown block.

    Only fields missing from the profile are surfaced (CP/W' appear when no FTP is
    configured) so the section complements manual values rather than repeating them.
    """
    lines: list[str] = []

    has_power = bool(profile and getattr(profile, "threshold_power", None))
    if not has_power and estimate.critical_power.value is not None:
        cp = estimate.critical_power.value
        detail = f" (confidence: {estimate.critical_power.confidence}"
        if estimate.w_prime is not None:
            detail += f", W' {estimate.w_prime:.0f} J"
        detail += ")"
        lines.append(f"- Critical Power (≈FTP): {cp:.0f} W{detail}")

    has_pace = bool(profile and profile.threshold_pace_min_km)
    if not has_pace and estimate.threshold_pace_min_km.value is not None:
        lines.append(
            f"- Threshold Pace: {_format_pace(estimate.threshold_pace_min_km.value)}"
            f" (confidence: {estimate.threshold_pace_min_km.confidence})"
        )

    has_hr = bool(profile and profile.threshold_hr)
    if not has_hr and estimate.threshold_hr.value is not None:
        lines.append(
            f"- Threshold HR (LTHR): {estimate.threshold_hr.value:.0f} bpm"
            f" (confidence: {estimate.threshold_hr.confidence})"
        )

    has_max = bool(profile and profile.max_hr)
    if not has_max and estimate.max_hr.value is not None:
        lines.append(f"- Max HR (observed): {estimate.max_hr.value:.0f} bpm")

    if not lines:
        return ""
    return (
        "## Estimated Thresholds (auto-derived from recent training)\n"
        "These are computed from power/pace/HR history and are not yet saved to the profile.\n"
        + "\n".join(lines)
    )
