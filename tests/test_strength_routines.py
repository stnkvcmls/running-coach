"""Tests for app/strength_routines.py — routine catalog, progression, and demo links."""

from app.strength_routines import (
    ROUTINE_IDS,
    exercise_demo_url,
    get_routine,
    get_routine_for_week,
)


# --- demo links ---

def test_exercise_demo_url_is_youtube_search():
    url = exercise_demo_url("Single-leg squat")
    assert url.startswith("https://www.youtube.com/results?search_query=")
    assert "Single-leg+squat" in url


def test_get_routine_hydrates_demo_url_on_every_exercise():
    routine = get_routine("running-base")
    assert routine is not None
    for ex in routine["exercises"]:
        assert ex["demo_url"].startswith("https://www.youtube.com/results?search_query=")


def test_get_routine_unknown_id_returns_none():
    assert get_routine("does-not-exist") is None


# --- progression ---

def test_progression_unchanged_weeks_1_and_2():
    base = get_routine("running-base")
    for week in (1, 2):
        progressed = get_routine_for_week("running-base", week)
        assert progressed["exercises"] == base["exercises"]


def test_progression_adds_one_set_from_week_3():
    base = get_routine("running-base")
    progressed = get_routine_for_week("running-base", 3)
    for base_ex, prog_ex in zip(base["exercises"], progressed["exercises"]):
        assert prog_ex["sets"] == base_ex["sets"] + 1
        assert "Progression: +1 set this week" in prog_ex["note"]


def test_progression_caps_at_plus_two_sets():
    base = get_routine("running-base")
    progressed = get_routine_for_week("running-base", 9)
    for base_ex, prog_ex in zip(base["exercises"], progressed["exercises"]):
        assert prog_ex["sets"] == base_ex["sets"] + 2
        assert "+2 sets this week" in prog_ex["note"]


def test_progression_preserves_existing_note():
    progressed = get_routine_for_week("running-base", 3)
    single_leg_squat = next(ex for ex in progressed["exercises"] if ex["name"] == "Single-leg squat")
    assert "Keep knee tracking over toes" in single_leg_squat["note"]
    assert "Progression" in single_leg_squat["note"]


def test_progression_sets_note_when_original_has_none():
    # "Fire hydrant" in hip-glute has note=None at baseline.
    progressed = get_routine_for_week("hip-glute", 3)
    fire_hydrant = next(ex for ex in progressed["exercises"] if ex["name"] == "Fire hydrant")
    assert fire_hydrant["note"] == "Progression: +1 set this week"


def test_get_routine_for_week_unknown_id_returns_none():
    assert get_routine_for_week("does-not-exist", 3) is None


def test_get_routine_for_week_does_not_mutate_library():
    """Progression must not leak into the static ROUTINE_LIBRARY or later lookups."""
    get_routine_for_week("running-base", 9)
    fresh = get_routine("running-base")
    baseline_squat = next(ex for ex in fresh["exercises"] if ex["name"] == "Single-leg squat")
    assert baseline_squat["sets"] == 3


def test_all_routine_ids_progress_without_error():
    for routine_id in ROUTINE_IDS:
        for week in (1, 3, 5, 8):
            assert get_routine_for_week(routine_id, week) is not None
