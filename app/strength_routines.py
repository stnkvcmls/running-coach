"""Static library of strength & mobility routines for structured plan days.

Each routine is keyed by a slug ID. The AI picks one per strength day;
the ID is stored on TrainingPlanDay.routine_id and hydrated at response time.
"""

from __future__ import annotations
from typing import TypedDict


class Exercise(TypedDict):
    name: str
    sets: int
    reps: str          # e.g. "12", "45 sec", "10 each side"
    note: str | None   # optional cue / substitution


class Routine(TypedDict):
    id: str
    name: str
    focus: str         # one-line description of what this targets
    duration_min: int  # approximate session length in minutes
    exercises: list[Exercise]


ROUTINE_LIBRARY: dict[str, Routine] = {
    "running-base": {
        "id": "running-base",
        "name": "Running Base Strength",
        "focus": "General running durability — glutes, quads, calves, and hip stabilisers",
        "duration_min": 30,
        "exercises": [
            {"name": "Single-leg squat", "sets": 3, "reps": "10 each side", "note": "Keep knee tracking over toes"},
            {"name": "Glute bridge", "sets": 3, "reps": "15", "note": "Drive through heels, pause at top"},
            {"name": "Calf raise", "sets": 3, "reps": "15", "note": "Slow descent (3 sec)"},
            {"name": "Side-lying hip abduction", "sets": 3, "reps": "15 each side", "note": None},
            {"name": "Side plank", "sets": 2, "reps": "45 sec each side", "note": None},
            {"name": "Romanian deadlift (single-leg)", "sets": 3, "reps": "10 each side", "note": "Hinge at hip, flat back"},
        ],
    },
    "hip-glute": {
        "id": "hip-glute",
        "name": "Hip & Glute Focus",
        "focus": "Hip stability and glute activation — targets IT-band and knee issues",
        "duration_min": 25,
        "exercises": [
            {"name": "Clamshell", "sets": 3, "reps": "20 each side", "note": "Keep hips stacked"},
            {"name": "Banded side-walk", "sets": 3, "reps": "15 steps each direction", "note": "Light resistance band above knees"},
            {"name": "Hip thrust", "sets": 3, "reps": "12", "note": "Bodyweight or add load"},
            {"name": "Fire hydrant", "sets": 3, "reps": "15 each side", "note": None},
            {"name": "Reverse lunge with knee drive", "sets": 3, "reps": "10 each side", "note": "Control the landing"},
            {"name": "Standing hip abduction", "sets": 2, "reps": "15 each side", "note": "Optional resistance band"},
        ],
    },
    "lower-leg": {
        "id": "lower-leg",
        "name": "Lower-Leg & Achilles",
        "focus": "Calf, Achilles, and ankle strength — targets lower-leg and plantar issues",
        "duration_min": 20,
        "exercises": [
            {"name": "Eccentric heel drop", "sets": 3, "reps": "15", "note": "Lower slowly over 3 sec on step edge"},
            {"name": "Single-leg calf raise", "sets": 3, "reps": "12 each side", "note": "Full range of motion"},
            {"name": "Ankle alphabet", "sets": 2, "reps": "1 full alphabet each foot", "note": "Seated; draw letters with big toe"},
            {"name": "Toe spread & short-foot", "sets": 3, "reps": "10 sec hold × 5", "note": "Intrinsic foot activation"},
            {"name": "Standing soleus raise (bent knee)", "sets": 3, "reps": "15", "note": "Slight knee bend targets soleus"},
            {"name": "Single-leg balance", "sets": 3, "reps": "30 sec each side", "note": "Eyes closed for extra challenge"},
        ],
    },
    "core-stability": {
        "id": "core-stability",
        "name": "Core & Stability",
        "focus": "Running-specific core strength, anti-rotation, and pelvic stability",
        "duration_min": 25,
        "exercises": [
            {"name": "Dead bug", "sets": 3, "reps": "10 each side", "note": "Lower back pressed to floor throughout"},
            {"name": "Bird-dog", "sets": 3, "reps": "10 each side", "note": "Extend opposite arm and leg"},
            {"name": "Plank", "sets": 3, "reps": "45 sec", "note": "Neutral spine, don't sag hips"},
            {"name": "Side plank with hip dip", "sets": 2, "reps": "10 dips each side", "note": None},
            {"name": "Pallof press", "sets": 3, "reps": "10 each side", "note": "Resist rotation; use band or cable"},
            {"name": "Copenhagen adductor plank", "sets": 2, "reps": "20 sec each side", "note": "Targets inner thigh / groin"},
        ],
    },
    "mobility-recovery": {
        "id": "mobility-recovery",
        "name": "Mobility & Recovery",
        "focus": "Active recovery, flexibility, and tissue preparation — suitable after hard efforts",
        "duration_min": 20,
        "exercises": [
            {"name": "Hip flexor stretch (low lunge)", "sets": 2, "reps": "60 sec each side", "note": "Posterior pelvic tilt to deepen"},
            {"name": "Figure-4 glute stretch", "sets": 2, "reps": "60 sec each side", "note": "Supine; pull knee toward chest"},
            {"name": "World's greatest stretch", "sets": 2, "reps": "5 each side", "note": "Lunge + thoracic rotation"},
            {"name": "Hamstring floss", "sets": 2, "reps": "10 each side", "note": "Seated; extend and flex knee slowly"},
            {"name": "Calf & Achilles stretch", "sets": 2, "reps": "45 sec each side", "note": "Straight and bent knee versions"},
            {"name": "Thoracic foam roll", "sets": 1, "reps": "90 sec", "note": "Roll upper back, pause on tight spots"},
        ],
    },
    "full-body": {
        "id": "full-body",
        "name": "Full-Body Running Strength",
        "focus": "Whole-body durability including upper back and posture for late-race form",
        "duration_min": 35,
        "exercises": [
            {"name": "Goblet squat", "sets": 3, "reps": "12", "note": "Dumbbell or kettlebell; chest tall"},
            {"name": "Single-leg Romanian deadlift", "sets": 3, "reps": "10 each side", "note": "Hinge at hip"},
            {"name": "Bent-over dumbbell row", "sets": 3, "reps": "12 each side", "note": "Supports running arm swing"},
            {"name": "Push-up", "sets": 3, "reps": "12", "note": "Full body plank position"},
            {"name": "Step-up with knee drive", "sets": 3, "reps": "10 each side", "note": "Box or stair"},
            {"name": "Plank with shoulder tap", "sets": 3, "reps": "10 each side", "note": "Minimise hip sway"},
        ],
    },
}

ROUTINE_IDS = list(ROUTINE_LIBRARY.keys())


def get_routine(routine_id: str) -> Routine | None:
    return ROUTINE_LIBRARY.get(routine_id)


def catalog_summary() -> str:
    """One-line-per-routine summary for inclusion in AI prompts."""
    lines = []
    for r in ROUTINE_LIBRARY.values():
        lines.append(f"  - {r['id']}: {r['name']} — {r['focus']}")
    return "\n".join(lines)
