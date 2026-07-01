"""Fuelling/hydration target helpers for long runs and races.

Derives carb-per-hour and fluid-per-hour targets from effort duration,
intensity, athlete body weight, and recent heat exposure (reusing the
heat-stress signal from ``app/weather.py`` via ``app.ai_coach``).

Model (sports-nutrition consensus for endurance running):
  - No fuelling guidance under 60 min — glycogen stores cover shorter efforts.
  - Carbs: 30 g/hr (60-90 min) -> 60 g/hr (90-150 min) -> 90 g/hr (150 min+),
    +15 g/hr at race intensity (higher glycogen turnover than an easy long run).
  - Fluid: ~6.5 mL per kg body weight per hour at neutral conditions
    (70 kg assumed when weight is unknown), +15% when recent runs show
    notable heat stress.
"""

from __future__ import annotations

from dataclasses import dataclass

_DEFAULT_WEIGHT_KG = 70.0
_FLUID_ML_PER_KG_PER_HOUR = 6.5
_HEAT_FLUID_BUMP = 1.15
_RACE_CARB_BUMP_G = 15


@dataclass
class FuellingGuidance:
    duration_sec: float
    carbs_g_per_hour: int
    fluid_ml_per_hour: int
    total_carbs_g: int
    total_fluid_ml: int
    note: str


def _carbs_g_per_hour(duration_sec: float, intensity: str) -> int:
    hours = duration_sec / 3600.0
    if hours < 1.5:
        base = 30
    elif hours < 2.5:
        base = 60
    else:
        base = 90
    if intensity == "race":
        base += _RACE_CARB_BUMP_G
    return base


def _fluid_ml_per_hour(weight_kg: float | None, heat_stress: bool) -> int:
    weight = weight_kg if weight_kg and weight_kg > 0 else _DEFAULT_WEIGHT_KG
    fluid = _FLUID_ML_PER_KG_PER_HOUR * weight
    if heat_stress:
        fluid *= _HEAT_FLUID_BUMP
    return round(fluid / 25) * 25


def _format_duration(duration_sec: float) -> str:
    total_min = round(duration_sec / 60)
    hours, minutes = divmod(total_min, 60)
    if hours and minutes:
        return f"{hours}h{minutes:02d}m"
    if hours:
        return f"{hours}h"
    return f"{minutes}m"


def compute_fuelling_guidance(
    duration_sec: float,
    intensity: str = "long",
    weight_kg: float | None = None,
    heat_stress: bool = False,
) -> FuellingGuidance | None:
    """Return carb/fluid targets for an effort, or None if too short to need them.

    intensity: "long" (easy aerobic effort) or "race" (higher glycogen turnover).
    """
    if duration_sec is None or duration_sec < 3600:
        return None

    hours = duration_sec / 3600.0
    carbs_per_hour = _carbs_g_per_hour(duration_sec, intensity)
    fluid_per_hour = _fluid_ml_per_hour(weight_kg, heat_stress)
    total_carbs = round(carbs_per_hour * hours)
    total_fluid = round(fluid_per_hour * hours / 25) * 25

    note = (
        f"~{carbs_per_hour} g carbs/hr and ~{fluid_per_hour} ml fluid/hr "
        f"over this {_format_duration(duration_sec)} effort"
    )
    if heat_stress:
        note += " — recent heat means extra fluid"

    return FuellingGuidance(
        duration_sec=duration_sec,
        carbs_g_per_hour=carbs_per_hour,
        fluid_ml_per_hour=fluid_per_hour,
        total_carbs_g=total_carbs,
        total_fluid_ml=total_fluid,
        note=note,
    )
