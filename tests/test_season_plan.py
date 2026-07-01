from datetime import date, datetime

import pytest

from app import season_plan
from app.models import AthleteProfile, Activity, GarminCalendarEvent, SeasonPlan, SeasonPlanWeek


# --- _race_distance_category ---

def test_race_distance_category_thresholds():
    assert season_plan._race_distance_category(42195) == "marathon"
    assert season_plan._race_distance_category(21097) == "half"
    assert season_plan._race_distance_category(10000) == "10k"
    assert season_plan._race_distance_category(5000) == "short"
    assert season_plan._race_distance_category(None) == "short"


# --- select_goal_race ---

def test_select_goal_race_prefers_priority_a_over_nearer_races(db):
    db.add(GarminCalendarEvent(
        garmin_id="b1", event_type="race", date=date(2026, 6, 20),
        title="Nearer B Race", distance_m=10000, priority="B",
    ))
    db.add(GarminCalendarEvent(
        garmin_id="a1", event_type="race", date=date(2026, 7, 10),
        title="Goal Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    goal = season_plan.select_goal_race(db, reference_date=date(2026, 6, 10))

    assert goal is not None
    assert goal.title == "Goal Marathon"
    assert goal.source == "garmin_calendar"


def test_select_goal_race_falls_back_to_nearest_when_no_a_priority(db):
    db.add(GarminCalendarEvent(
        garmin_id="c1", event_type="race", date=date(2026, 7, 1),
        title="Later C Race", distance_m=5000, priority="C",
    ))
    db.add(GarminCalendarEvent(
        garmin_id="b1", event_type="race", date=date(2026, 6, 20),
        title="Nearer B Race", distance_m=10000, priority="B",
    ))
    db.commit()

    goal = season_plan.select_goal_race(db, reference_date=date(2026, 6, 10))

    assert goal is not None
    assert goal.title == "Nearer B Race"


def test_select_goal_race_falls_back_to_profile_goal_race_date(db):
    db.add(AthleteProfile(goal_race="Personal Marathon", goal_race_date=date(2026, 9, 1)))
    db.commit()

    goal = season_plan.select_goal_race(db, reference_date=date(2026, 6, 10))

    assert goal is not None
    assert goal.title == "Personal Marathon"
    assert goal.source == "profile"
    assert goal.distance_m is None


def test_select_goal_race_none_when_nothing_set(db):
    assert season_plan.select_goal_race(db, reference_date=date(2026, 6, 10)) is None


def test_select_goal_race_ignores_past_profile_date(db):
    db.add(AthleteProfile(goal_race="Old Race", goal_race_date=date(2026, 1, 1)))
    db.commit()

    assert season_plan.select_goal_race(db, reference_date=date(2026, 6, 10)) is None


# --- _split_phases ---

@pytest.mark.parametrize("build_weeks,expected", [
    (0, (0, 0, 0)),
    (1, (1, 0, 0)),
    (2, (2, 0, 0)),
    (3, (1, 1, 1)),
    (4, (2, 1, 1)),
])
def test_split_phases(build_weeks, expected):
    assert season_plan._split_phases(build_weeks) == expected


@pytest.mark.parametrize("build_weeks", [5, 8, 10, 16])
def test_split_phases_sums_and_nonzero(build_weeks):
    base_n, build_n, peak_n = season_plan._split_phases(build_weeks)
    assert base_n + build_n + peak_n == build_weeks
    assert base_n >= 1 and build_n >= 1 and peak_n >= 1


# --- generate_season_plan ---

def test_generate_season_plan_none_without_goal_race(db):
    assert season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10)) is None


def test_generate_season_plan_none_when_race_this_week(db):
    # Wednesday reference; race is Friday of the *same* week, before the
    # skeleton's start (next Monday) — nothing to periodize.
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 6, 12),
        title="This Week 5K", distance_m=5000, priority="A",
    ))
    db.commit()

    assert season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10)) is None


def test_generate_season_plan_short_marathon_window_clamps_taper(db):
    # Marathon 2 weeks out from the skeleton's start (next Monday) — too
    # short for a full 3-week taper, so taper clamps to the available week.
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 6, 27),
        title="Soon Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10))

    assert plan is not None
    weeks = (
        db.query(SeasonPlanWeek)
        .filter(SeasonPlanWeek.season_plan_id == plan.id)
        .order_by(SeasonPlanWeek.week_number)
        .all()
    )
    phases = [w.phase for w in weeks]
    # 2 weeks to the race (start=6/15, race week starts 6/22): 1 taper week + race week,
    # then 2 marathon recovery weeks.
    assert phases == ["taper", "race", "recovery", "recovery"]
    assert weeks[0].notes == "Taper — 1 week out"


def test_generate_season_plan_full_marathon_periodization(db):
    # 16 weeks from start (6/15) to race week (10/5's Monday), marathon distance.
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10))

    assert plan is not None
    assert plan.goal_race_title == "Autumn Marathon"
    assert plan.goal_race_date == date(2026, 10, 3)
    assert plan.goal_race_source == "garmin_calendar"

    weeks = (
        db.query(SeasonPlanWeek)
        .filter(SeasonPlanWeek.season_plan_id == plan.id)
        .order_by(SeasonPlanWeek.week_number)
        .all()
    )
    phases = [w.phase for w in weeks]
    # Last 3 weeks before race week must be taper, then race, then 2 recovery weeks.
    assert phases[-6:] == ["taper", "taper", "taper", "race", "recovery", "recovery"]
    assert phases[0] == "base"
    assert "build" in phases
    assert "peak" in phases
    # Phase order is monotonic: base weeks all precede build weeks, etc.
    order = {"base": 0, "build": 1, "peak": 2, "taper": 3, "race": 4, "recovery": 5}
    ranks = [order[p] for p in phases]
    assert ranks == sorted(ranks)


def test_generate_season_plan_target_km_ramps_and_cuts_back(db):
    db.add(AthleteProfile(weekly_mileage_km=30.0, target_weekly_km=50.0, training_volume="steady"))
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10))
    assert plan.peak_weekly_km == 50.0

    weeks = (
        db.query(SeasonPlanWeek)
        .filter(SeasonPlanWeek.season_plan_id == plan.id)
        .order_by(SeasonPlanWeek.week_number)
        .all()
    )
    ramp_weeks = [w for w in weeks if w.phase in ("base", "build", "peak")]
    assert all(w.target_weekly_km is not None for w in ramp_weeks)
    # Cutback week (every 4th) should be lower than the week before it.
    cutback = next(w for w in ramp_weeks if w.week_number % 4 == 0)
    prior = next(w for w in ramp_weeks if w.week_number == cutback.week_number - 1)
    assert cutback.target_weekly_km < prior.target_weekly_km

    race_week = next(w for w in weeks if w.phase == "race")
    assert race_week.target_weekly_km == pytest.approx(50.0 * 0.45)

    taper1 = next(w for w in weeks if w.phase == "taper" and w.notes == "Taper — 1 week out")
    assert taper1.target_weekly_km == pytest.approx(50.0 * 0.70)

    recovery1 = next(w for w in weeks if w.phase == "recovery" and "week 1" in w.notes)
    assert recovery1.target_weekly_km == pytest.approx(50.0 * 0.35)


def test_generate_season_plan_no_target_km_without_baseline(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10))
    assert plan.peak_weekly_km is None

    weeks = (
        db.query(SeasonPlanWeek)
        .filter(SeasonPlanWeek.season_plan_id == plan.id)
        .all()
    )
    assert all(w.target_weekly_km is None for w in weeks)
    assert len(weeks) > 0


def test_generate_season_plan_baseline_from_recent_activities(db):
    for i in range(4):
        db.add(Activity(
            garmin_id=100 + i, name="Run", activity_type="running",
            started_at=datetime(2026, 6, 2 + i * 2, 7, 0),
            distance_m=10000,
        ))
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.generate_season_plan(db, reference_date=date(2026, 6, 10))
    # 4 runs of 10km inside the last 28 days -> 40km / 4 weeks = 10km baseline.
    assert plan.peak_weekly_km == pytest.approx(10.0 * 1.25)


# --- ensure_season_plan ---

def test_ensure_season_plan_generates_when_missing(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    plan = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 10))
    assert plan is not None


def test_ensure_season_plan_reuses_when_goal_unchanged(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    first = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 10))
    second = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 11))

    assert first.id == second.id
    assert db.query(SeasonPlan).count() == 1


def test_ensure_season_plan_regenerates_when_goal_changes(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()
    first = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 10))

    # A higher-priority race gets added later — the goal race changes.
    db.add(GarminCalendarEvent(
        garmin_id="r2", event_type="race", date=date(2026, 8, 1),
        title="Summer Half", distance_m=21097, priority="A",
    ))
    db.commit()
    second = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 12))

    assert second.id != first.id
    assert second.goal_race_title == "Summer Half"
    assert db.query(SeasonPlan).count() == 2


def test_ensure_season_plan_returns_existing_when_goal_disappears(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 6, 27),
        title="Soon Race", distance_m=10000, priority="A",
    ))
    db.commit()
    first = season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 10))
    assert first is not None

    # Reference date moves past the race; no upcoming races remain.
    result = season_plan.ensure_season_plan(db, reference_date=date(2026, 7, 1))
    assert result.id == first.id


def test_ensure_season_plan_none_when_nothing_ever_existed(db):
    assert season_plan.ensure_season_plan(db, reference_date=date(2026, 6, 10)) is None


# --- build_season_plan_context ---

def test_build_season_plan_context_renders_weeks_and_goal(db):
    db.add(AthleteProfile(weekly_mileage_km=30.0, target_weekly_km=50.0))
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    context = season_plan.build_season_plan_context(
        db, user_id=1, window_start=date(2026, 6, 15), window_weeks=4,
        reference_date=date(2026, 6, 10),
    )

    assert context is not None
    assert "## Season Plan Skeleton" in context
    assert "BASE" in context
    assert "Autumn Marathon" in context
    assert "2026-10-03" in context


def test_build_season_plan_context_none_without_goal_race(db):
    context = season_plan.build_season_plan_context(
        db, user_id=1, window_start=date(2026, 6, 15), window_weeks=4,
        reference_date=date(2026, 6, 10),
    )
    assert context is None


def test_build_season_plan_context_none_when_window_outside_skeleton(db):
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 10, 3),
        title="Autumn Marathon", distance_m=42195, priority="A",
    ))
    db.commit()

    context = season_plan.build_season_plan_context(
        db, user_id=1, window_start=date(2027, 1, 1), window_weeks=4,
        reference_date=date(2026, 6, 10),
    )
    assert context is None
