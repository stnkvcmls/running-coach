from datetime import date

from app import ai_coach
from app.models import AthleteProfile


def test_context_includes_profile_section(db):
    db.add(
        AthleteProfile(
            name="Sam Runner",
            date_of_birth=date(1990, 6, 15),
            goal_race="Berlin Marathon",
            goal_race_date=date(2026, 9, 27),
            max_hr=190,
        )
    )
    db.commit()

    context = ai_coach._build_context(db, "activity", "Test trigger data")
    assert "## Athlete Profile" in context
    assert "Sam Runner" in context
    assert "Berlin Marathon" in context
    # Age is derived from date_of_birth, not stored literally.
    assert "- Age:" in context


def test_context_omits_section_when_no_profile(db):
    context = ai_coach._build_context(db, "activity", "Test trigger data")
    assert "## Athlete Profile" not in context
    # Still produces the baseline trigger section without crashing.
    assert "## Current Data" in context
