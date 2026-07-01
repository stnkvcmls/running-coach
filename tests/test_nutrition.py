"""Tests for app/nutrition.py — fuelling/hydration guidance."""

import pytest

from app.nutrition import compute_fuelling_guidance


# --- duration gating ---

def test_no_guidance_under_one_hour():
    assert compute_fuelling_guidance(duration_sec=3000) is None


def test_guidance_at_exactly_one_hour():
    guidance = compute_fuelling_guidance(duration_sec=3600)
    assert guidance is not None


def test_no_guidance_for_none_duration():
    assert compute_fuelling_guidance(duration_sec=None) is None


# --- carb tiers ---

def test_carb_tier_short_long_run():
    # 75 min, easy long run -> 30 g/hr tier
    guidance = compute_fuelling_guidance(duration_sec=75 * 60, intensity="long")
    assert guidance.carbs_g_per_hour == 30


def test_carb_tier_mid_long_run():
    # 2h, easy long run -> 60 g/hr tier
    guidance = compute_fuelling_guidance(duration_sec=120 * 60, intensity="long")
    assert guidance.carbs_g_per_hour == 60


def test_carb_tier_long_ultra_effort():
    # 3h, easy long run -> 90 g/hr tier
    guidance = compute_fuelling_guidance(duration_sec=180 * 60, intensity="long")
    assert guidance.carbs_g_per_hour == 90


def test_race_intensity_bumps_carbs():
    long_guidance = compute_fuelling_guidance(duration_sec=90 * 60, intensity="long")
    race_guidance = compute_fuelling_guidance(duration_sec=90 * 60, intensity="race")
    assert race_guidance.carbs_g_per_hour == long_guidance.carbs_g_per_hour + 15


# --- fluid targets ---

def test_fluid_scales_with_weight():
    light = compute_fuelling_guidance(duration_sec=3600, weight_kg=50)
    heavy = compute_fuelling_guidance(duration_sec=3600, weight_kg=90)
    assert heavy.fluid_ml_per_hour > light.fluid_ml_per_hour


def test_fluid_defaults_when_weight_missing():
    guidance = compute_fuelling_guidance(duration_sec=3600, weight_kg=None)
    assert guidance.fluid_ml_per_hour > 0


def test_heat_stress_bumps_fluid():
    neutral = compute_fuelling_guidance(duration_sec=3600, weight_kg=70, heat_stress=False)
    hot = compute_fuelling_guidance(duration_sec=3600, weight_kg=70, heat_stress=True)
    assert hot.fluid_ml_per_hour > neutral.fluid_ml_per_hour


def test_heat_stress_reflected_in_note():
    hot = compute_fuelling_guidance(duration_sec=3600, weight_kg=70, heat_stress=True)
    assert "heat" in hot.note.lower()


def test_no_heat_mention_when_neutral():
    neutral = compute_fuelling_guidance(duration_sec=3600, weight_kg=70, heat_stress=False)
    assert "heat" not in neutral.note.lower()


# --- totals ---

def test_totals_scale_with_duration():
    guidance = compute_fuelling_guidance(duration_sec=7200, intensity="long", weight_kg=70)
    assert guidance.total_carbs_g == pytest.approx(guidance.carbs_g_per_hour * 2, abs=1)
    assert guidance.total_fluid_ml == pytest.approx(guidance.fluid_ml_per_hour * 2, abs=25)


def test_note_contains_duration():
    guidance = compute_fuelling_guidance(duration_sec=135 * 60, intensity="long")
    assert "2h15m" in guidance.note
