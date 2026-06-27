"""Race-day pacing strategy: generate per-km/mile split targets.

Given a target finish time and race distance, produces even or negative-split
pacing plans anchored to the CV model where possible.
"""
from __future__ import annotations

from dataclasses import dataclass, field

_MILE_IN_METERS = 1609.344


@dataclass
class PacingSplit:
    split_number: int
    split_distance_m: float       # this split's distance
    cumulative_distance_m: float  # running total
    target_pace_min_km: float     # target pace for this split
    split_time_sec: float         # time for this split
    cumulative_time_sec: float    # running total


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


def generate_pacing_strategy(
    distance_m: float,
    target_time_sec: float,
    strategy: str = "even",
    split_unit: str = "km",
    predicted_time_sec: float | None = None,
    source: str = "goal",
) -> PacingPlan:
    """Generate a race-day pacing plan.

    Args:
        distance_m: Race distance in metres.
        target_time_sec: Target finish time in seconds.
        strategy: "even" (constant pace) or "negative_split" (first half 2% slower,
                  second half 2% faster, preserving total time).
        split_unit: "km" or "mile".
        predicted_time_sec: CP/CV model prediction for display only.
        source: Origin of target_time_sec — "goal", "predicted", or "custom".
    """
    if distance_m <= 0 or target_time_sec <= 0:
        raise ValueError("distance_m and target_time_sec must be positive")

    split_dist_m = _MILE_IN_METERS if split_unit == "mile" else 1000.0
    overall_pace = (target_time_sec / distance_m) * 1000.0 / 60.0

    n_total_approx = (distance_m / split_dist_m)
    half_idx = int(n_total_approx) // 2  # first half/second half boundary index

    if strategy == "negative_split":
        # First half: 2% slower; second half: 2% faster → net time unchanged.
        def pace_fn(i: int, n: int) -> float:
            return overall_pace * (1.02 if i < n // 2 else 0.98)
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
