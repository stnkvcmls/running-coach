"""Race-day pacing strategy: generate per-km/mile split targets.

Given a target finish time and race distance, produces even, negative-split, or
terrain (grade-adjusted-effort) pacing plans anchored to the CV model where
possible.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.streams import minetti_factor

_MILE_IN_METERS = 1609.344


@dataclass
class PacingSplit:
    split_number: int
    split_distance_m: float       # this split's distance
    cumulative_distance_m: float  # running total
    target_pace_min_km: float     # target pace for this split
    split_time_sec: float         # time for this split
    cumulative_time_sec: float    # running total
    grade_pct: float | None = None  # avg grade over this split (terrain strategy only)


@dataclass
class PacingPlan:
    distance_m: float
    target_time_sec: float
    target_pace_min_km: float   # overall average pace
    strategy: str               # "even" | "negative_split"
    split_unit: str             # "km" | "mile"
    split_distance_m: float     # nominal split distance in metres
    splits: list[PacingSplit] = field(default_factory=list)
    predicted_time_sec: float | None = None  # from CP/CV model for reference
    source: str = "goal"        # "goal" | "predicted" | "custom"


def _split_time(pace_min_km: float, dist_m: float) -> float:
    """Convert pace (min/km) + distance (m) to split time in seconds."""
    return dist_m / 1000.0 * pace_min_km * 60.0


def _build_splits(
    distance_m: float,
    split_dist_m: float,
    pace_fn,  # callable(split_index: int, n_full: int) -> pace_min_km
) -> list[PacingSplit]:
    n_full = int(distance_m // split_dist_m)
    remainder_m = distance_m - n_full * split_dist_m
    n_total = n_full + (1 if remainder_m > 0.5 else 0)

    splits: list[PacingSplit] = []
    cumulative_time = 0.0
    cumulative_dist = 0.0

    for i in range(n_full):
        pace = pace_fn(i, n_total)
        t = _split_time(pace, split_dist_m)
        cumulative_time += t
        cumulative_dist += split_dist_m
        splits.append(PacingSplit(
            split_number=i + 1,
            split_distance_m=split_dist_m,
            cumulative_distance_m=round(cumulative_dist, 1),
            target_pace_min_km=round(pace, 3),
            split_time_sec=round(t, 1),
            cumulative_time_sec=round(cumulative_time, 1),
        ))

    if remainder_m > 0.5:
        pace = pace_fn(n_full, n_total)
        t = _split_time(pace, remainder_m)
        cumulative_time += t
        cumulative_dist += remainder_m
        splits.append(PacingSplit(
            split_number=n_full + 1,
            split_distance_m=round(remainder_m, 1),
            cumulative_distance_m=round(cumulative_dist, 1),
            target_pace_min_km=round(pace, 3),
            split_time_sec=round(t, 1),
            cumulative_time_sec=round(cumulative_time, 1),
        ))

    return splits


def _split_boundaries(distance_m: float, split_dist_m: float) -> list[tuple[float, float]]:
    """(start, end) distance pairs for each split, in course order."""
    n_full = int(distance_m // split_dist_m)
    remainder_m = distance_m - n_full * split_dist_m
    boundaries = [(i * split_dist_m, (i + 1) * split_dist_m) for i in range(n_full)]
    if remainder_m > 0.5:
        boundaries.append((n_full * split_dist_m, distance_m))
    return boundaries


def _elevation_at(profile: list[tuple[float, float]], profile_span: float, course_dist_m: float, d: float) -> float:
    """Interpolate elevation at course distance ``d``, mapping onto the profile's own span."""
    frac = 0.0 if course_dist_m <= 0 else d / course_dist_m
    target = profile[0][0] + frac * profile_span
    for i in range(1, len(profile)):
        d0, e0 = profile[i - 1]
        d1, e1 = profile[i]
        if target <= d1 or i == len(profile) - 1:
            if d1 == d0:
                return e1
            t = max(0.0, min(1.0, (target - d0) / (d1 - d0)))
            return e0 + t * (e1 - e0)
    raise AssertionError("unreachable: loop always returns on its final iteration")


def _profile_grade(profile: list[tuple[float, float]], profile_span: float, course_dist_m: float, d0: float, d1: float) -> float:
    """Average grade (rise/run) between course distances ``d0`` and ``d1``."""
    if d1 <= d0 or profile_span <= 0:
        return 0.0
    e0 = _elevation_at(profile, profile_span, course_dist_m, d0)
    e1 = _elevation_at(profile, profile_span, course_dist_m, d1)
    return (e1 - e0) / (d1 - d0)


def _build_terrain_splits(
    distance_m: float,
    split_dist_m: float,
    target_time_sec: float,
    elevation_profile: list[tuple[float, float]],
) -> list[PacingSplit]:
    """Grade-adjusted-effort splits: hold GAP-equivalent pace constant across the
    course profile so uphill splits run slower and downhill splits run faster,
    while the sum of split times still equals ``target_time_sec``.
    """
    profile = sorted(elevation_profile, key=lambda p: p[0])
    profile_span = profile[-1][0] - profile[0][0]

    boundaries = _split_boundaries(distance_m, split_dist_m)
    grades = [_profile_grade(profile, profile_span, distance_m, d0, d1) for d0, d1 in boundaries]
    factors = [minetti_factor(g) for g in grades]
    dists = [d1 - d0 for d0, d1 in boundaries]

    # effort_speed (m/s, flat-equivalent) such that Σ(dist·factor/effort_speed) == target_time_sec
    weighted = sum(d * f for d, f in zip(dists, factors))
    effort_speed = weighted / target_time_sec

    splits: list[PacingSplit] = []
    cumulative_time = 0.0
    cumulative_dist = 0.0
    for i, ((d0, d1), grade, factor) in enumerate(zip(boundaries, grades, factors)):
        dist = d1 - d0
        pace = 1000.0 * factor / (effort_speed * 60.0)
        t = _split_time(pace, dist)
        cumulative_time += t
        cumulative_dist += dist
        splits.append(PacingSplit(
            split_number=i + 1,
            split_distance_m=round(dist, 1),
            cumulative_distance_m=round(cumulative_dist, 1),
            target_pace_min_km=round(pace, 3),
            split_time_sec=round(t, 1),
            cumulative_time_sec=round(cumulative_time, 1),
            grade_pct=round(grade * 100.0, 1),
        ))
    return splits


def generate_pacing_strategy(
    distance_m: float,
    target_time_sec: float,
    strategy: str = "even",
    split_unit: str = "km",
    predicted_time_sec: float | None = None,
    source: str = "goal",
    elevation_profile: list[tuple[float, float]] | None = None,
) -> PacingPlan:
    """Generate a race-day pacing plan.

    Args:
        distance_m: Race distance in metres.
        target_time_sec: Target finish time in seconds.
        strategy: "even" (constant pace), "negative_split" (first half 2% slower,
                  second half 2% faster, preserving total time), or "terrain"
                  (grade-adjusted-effort splits from ``elevation_profile``).
        split_unit: "km" or "mile".
        predicted_time_sec: CP/CV model prediction for display only.
        source: Origin of target_time_sec — "goal", "predicted", or "custom".
        elevation_profile: (distance_m, elevation_m) pairs describing a course,
                            required when ``strategy == "terrain"``. Its distance
                            axis is scaled to ``distance_m``, so it doesn't need
                            to span the exact race distance.
    """
    if distance_m <= 0 or target_time_sec <= 0:
        raise ValueError("distance_m and target_time_sec must be positive")

    split_dist_m = _MILE_IN_METERS if split_unit == "mile" else 1000.0
    overall_pace = (target_time_sec / distance_m) * 1000.0 / 60.0

    if strategy == "terrain":
        if not elevation_profile or len(elevation_profile) < 2:
            raise ValueError("terrain strategy requires an elevation_profile with at least 2 points")
        splits = _build_terrain_splits(distance_m, split_dist_m, target_time_sec, elevation_profile)
    elif strategy == "negative_split":
        # First half: 2% slower; second half: 2% faster → net time unchanged.
        def pace_fn(i: int, n: int) -> float:
            return overall_pace * (1.02 if i < n // 2 else 0.98)
        splits = _build_splits(distance_m, split_dist_m, pace_fn)
    else:
        def pace_fn(i: int, n: int) -> float:
            return overall_pace
        splits = _build_splits(distance_m, split_dist_m, pace_fn)

    return PacingPlan(
        distance_m=distance_m,
        target_time_sec=target_time_sec,
        target_pace_min_km=round(overall_pace, 3),
        strategy=strategy,
        split_unit=split_unit,
        split_distance_m=split_dist_m,
        splits=splits,
        predicted_time_sec=predicted_time_sec,
        source=source,
    )
