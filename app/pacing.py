"""Race-day pacing strategy: generate per-km/mile split targets.

Given a target finish time and race distance, produces even or negative-split
pacing plans anchored to the CV model where possible.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace

from app.weather import heat_pace_adjustment

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
    conditions_temp_c: float | None = None       # expected race-day temp, if supplied
    conditions_dew_point_c: float | None = None  # expected race-day dew point, if supplied
    conditions_penalty_pct: float | None = None  # heat penalty %, if conditions supplied
    adjusted_target_time_sec: float | None = None  # target_time_sec scaled by the heat factor


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


def _apply_conditions_factor(splits: list[PacingSplit], factor: float) -> list[PacingSplit]:
    """Scale each split's target pace/time by a heat/humidity factor (>= 1.0 = slower),
    recomputing cumulative distance/time so the plan stays internally consistent.
    """
    scaled: list[PacingSplit] = []
    cumulative_time = 0.0
    for s in splits:
        t = s.split_time_sec * factor
        cumulative_time += t
        scaled.append(replace(
            s,
            target_pace_min_km=round(s.target_pace_min_km * factor, 3),
            split_time_sec=round(t, 1),
            cumulative_time_sec=round(cumulative_time, 1),
        ))
    return scaled


def generate_pacing_strategy(
    distance_m: float,
    target_time_sec: float,
    strategy: str = "even",
    split_unit: str = "km",
    predicted_time_sec: float | None = None,
    source: str = "goal",
    expected_temp_c: float | None = None,
    expected_dew_point_c: float | None = None,
) -> PacingPlan:
    """Generate a race-day pacing plan.

    Args:
        distance_m: Race distance in metres.
        target_time_sec: Target finish time in seconds.
        strategy: "even" (constant pace) or "negative_split" (first half 2%
                  slower, second half 2% faster, preserving total time).
        split_unit: "km" or "mile".
        predicted_time_sec: CP/CV model prediction for display only.
        source: Origin of target_time_sec — "goal", "predicted", or "custom".
        expected_temp_c: Expected race-day temperature in °C. When supplied
                          (with or without ``expected_dew_point_c``), every split's
                          pace/time is scaled by the same heat factor used to
                          weather-adjust past runs.
        expected_dew_point_c: Expected race-day dew point in °C.
    """
    if distance_m <= 0 or target_time_sec <= 0:
        raise ValueError("distance_m and target_time_sec must be positive")
    if strategy not in ("even", "negative_split"):
        raise ValueError(f"Unsupported pacing strategy: {strategy!r}")

    split_dist_m = _MILE_IN_METERS if split_unit == "mile" else 1000.0
    overall_pace = (target_time_sec / distance_m) * 1000.0 / 60.0

    if strategy == "negative_split":
        # First half: 2% slower; second half: 2% faster → net time unchanged.
        def pace_fn(i: int, n: int) -> float:
            return overall_pace * (1.02 if i < n // 2 else 0.98)
        splits = _build_splits(distance_m, split_dist_m, pace_fn)
    else:
        def pace_fn(i: int, n: int) -> float:
            return overall_pace
        splits = _build_splits(distance_m, split_dist_m, pace_fn)

    conditions_penalty_pct: float | None = None
    adjusted_target_time_sec: float | None = None
    if expected_temp_c is not None or expected_dew_point_c is not None:
        factor, conditions_penalty_pct = heat_pace_adjustment(expected_temp_c, expected_dew_point_c)
        splits = _apply_conditions_factor(splits, factor)
        adjusted_target_time_sec = round(target_time_sec * factor, 1)

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
        conditions_temp_c=expected_temp_c,
        conditions_dew_point_c=expected_dew_point_c,
        conditions_penalty_pct=conditions_penalty_pct,
        adjusted_target_time_sec=adjusted_target_time_sec,
    )
