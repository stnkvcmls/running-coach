import json
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app import ai_coach
from app.models import (
    Activity,
    AIJob,
    AthleteProfile,
    CoachMemory,
    DailySummary,
    GarminCalendarEvent,
    Insight,
    MetricZone,
    SyncStatus,
    TrainingPlan,
    TrainingPlanDay,
)


# --- _classify_metric ---

def _cadence_zones():
    return [
        MetricZone(metric_key="cadence", zone_name="excellent", zone_color="#ff69b4",
                   percentile_label=">95%", min_value=185, max_value=None),
        MetricZone(metric_key="cadence", zone_name="average", zone_color="#2ecc71",
                   percentile_label="30-69%", min_value=163, max_value=173),
        MetricZone(metric_key="cadence", zone_name="poor", zone_color="#e74c3c",
                   percentile_label="<5%", min_value=None, max_value=151),
    ]


def test_classify_metric_bounded_zone():
    out = ai_coach._classify_metric(168, _cadence_zones())
    assert "Average zone" in out
    assert "30-69%" in out


def test_classify_metric_unbounded_max():
    out = ai_coach._classify_metric(200, _cadence_zones())
    assert "Excellent zone" in out


def test_classify_metric_no_match_returns_empty():
    # 160 falls between the poor (<151) and average (163-173) bands defined here.
    assert ai_coach._classify_metric(160, _cadence_zones()) == ""


# --- _format_activity_context ---

def test_format_activity_context_core_fields():
    act = Activity(
        name="Tempo Run",
        activity_type="running",
        started_at=datetime(2026, 6, 10, 7, 30),
        distance_m=10000,
        duration_sec=2700,
        avg_pace_min_km=4.5,
        avg_hr=155,
        max_hr=172,
    )
    text = ai_coach._format_activity_context(act)
    assert "**Tempo Run** (running)" in text
    assert "Distance: 10.00 km" in text
    assert "Duration: 45:00" in text
    assert "Avg Pace: 4:30 /km" in text
    assert "Avg HR: 155 bpm" in text


def test_format_activity_context_with_zone_classification():
    act = Activity(name="Run", activity_type="running", avg_cadence=200)
    zones = {"cadence": _cadence_zones()}
    text = ai_coach._format_activity_context(act, zones)
    assert "Cadence: 200 spm" in text
    assert "Excellent zone" in text


def test_format_activity_context_power_zones_json():
    act = Activity(
        name="Run", activity_type="running",
        power_zones_json=json.dumps([{"zoneNumber": 2, "secsInZone": 600}]),
    )
    text = ai_coach._format_activity_context(act)
    assert "Power Zones: PZ2: 10m" in text


def test_format_activity_context_handles_missing_start():
    act = Activity(name="Run", activity_type="running", started_at=None)
    text = ai_coach._format_activity_context(act)
    assert "Date: unknown" in text


def test_format_activity_context_rich_fields():
    act = Activity(
        name="Long Run", activity_type="running",
        started_at=datetime(2026, 6, 10, 7, 0),
        distance_m=21000, duration_sec=7200, avg_pace_min_km=5.0,
        avg_hr=150, max_hr=175, min_hr=110,
        avg_cadence=180, avg_stride=1.2,
        elevation_gain=200, elevation_loss=180,
        training_effect_aerobic=3.5, training_effect_anaerobic=1.2, vo2max=52,
        calories=1400,
        avg_ground_contact_time=240, avg_vertical_oscillation=8.0, avg_vertical_ratio=7.0,
        normalized_power=280, training_stress_score=120, intensity_factor=0.85,
        avg_respiration_rate=35, max_respiration_rate=48,
        avg_speed=3.3, max_speed=4.5,
        max_elevation=300, min_elevation=100, max_cadence=190,
        run_time_sec=6000, walk_time_sec=600,
        hr_zones_json=json.dumps([{"zoneNumber": 2, "secsInZone": 1200}]),
        splits_json=json.dumps({"lapDTOs": [
            {"distance": 1000, "duration": 300, "averageHR": 150},
        ]}),
        laps_json=json.dumps({"metricDescriptors": [{"key": "directHeartRate"}]}),
    )
    text = ai_coach._format_activity_context(act)
    assert "VO2max: 52.0" in text
    assert "Ground Contact Time: 240 ms" in text
    assert "Normalized Power: 280 W" in text
    assert "Avg Respiration: 35.0 br/min" in text
    assert "Avg Speed:" in text
    assert "Min HR: 110 bpm" in text
    assert "Run/Walk:" in text
    assert "HR Zones: Z2: 20m" in text
    assert "Split details:" in text
    assert "(Detailed lap/metric data available)" in text


# --- _format_daily_context ---

def test_format_daily_context():
    summary = DailySummary(
        date=date(2026, 6, 10), steps=12000, resting_hr=47,
        sleep_seconds=27000, sleep_score=85, stress_avg=30,
        body_battery_high=95, body_battery_low=20, total_calories=2500,
        intensity_minutes=45,
    )
    text = ai_coach._format_daily_context(summary)
    assert "Daily Summary for 2026-06-10" in text
    assert "Steps: 12,000" in text
    assert "Sleep: 7h 30m" in text
    assert "Body Battery: 20-95" in text


# --- _format_athlete_profile_context ---

def test_format_profile_context_emits_set_fields():
    profile = AthleteProfile(
        name="Sam", date_of_birth=date(1990, 6, 15),
        goal_race="Berlin", goal_race_date=date(2026, 9, 27),
        threshold_pace_min_km=4.0, threshold_hr=168, max_hr=190,
    )
    text = ai_coach._format_athlete_profile_context(profile, reference_date=date(2026, 6, 17))
    assert "## Athlete Profile" in text
    assert "- Name: Sam" in text
    assert "- Age: 36" in text
    assert "Goal Race: Berlin on 2026-09-27 (102 days away)" in text
    assert "- Threshold Pace: 4:00/km" in text


def test_format_profile_context_empty_returns_blank():
    assert ai_coach._format_athlete_profile_context(AthleteProfile()) == ""


def test_format_profile_context_goal_date_only():
    profile = AthleteProfile(goal_race_date=date(2026, 7, 1))
    text = ai_coach._format_athlete_profile_context(profile, reference_date=date(2026, 6, 17))
    assert "Goal Race Date: 2026-07-01 (14 days away)" in text


# --- _format_coach_memory_context ---

def test_format_coach_memory_context_emits_active_entries(db):
    db.add(CoachMemory(user_id=1, category="niggle", tag="knee pain", note="Sore after long runs.", active=True))
    db.add(CoachMemory(user_id=1, category="constraint", tag="travel", note="Away next week.", active=True))
    db.add(CoachMemory(user_id=1, category="preference", tag="treadmill", note="Hates treadmills.", active=False))
    db.commit()

    text = ai_coach._format_coach_memory_context(db, 1)
    assert "## What The Coach Remembers" in text
    assert "[niggle] knee pain: Sore after long runs." in text
    assert "[constraint] travel: Away next week." in text
    assert "treadmill" not in text  # inactive entries are excluded


def test_format_coach_memory_context_empty_returns_blank(db):
    assert ai_coach._format_coach_memory_context(db, 1) == ""


def test_format_coach_memory_context_scoped_to_user(db):
    db.add(CoachMemory(user_id=2, category="niggle", tag="shin splints", note="Other athlete.", active=True))
    db.commit()
    assert ai_coach._format_coach_memory_context(db, 1) == ""


# --- _extract_summary_and_category ---

def test_extract_summary_from_marker():
    content = "Intro line\n**Summary:** Strong tempo effort\nMore text"
    summary, category = ai_coach._extract_summary_and_category(content, "activity")
    assert summary == "Strong tempo effort"
    assert category == "workout_analysis"


def test_extract_summary_fallback_first_line():
    content = "Just the first line here\nSecond line"
    summary, category = ai_coach._extract_summary_and_category(content, "daily_summary")
    assert summary == "Just the first line here"
    assert category == "recovery"


def test_extract_category_default_for_unknown_trigger():
    _, category = ai_coach._extract_summary_and_category("x", "something_else")
    assert category == "recommendation"


# --- _get_ai_config / _call_ai dispatch ---

def test_get_ai_config_defaults(db):
    provider, model = ai_coach._get_ai_config(db)
    assert provider == "claude"
    assert model  # falls back to settings.ai_model


def test_get_ai_config_from_db(db):
    db.add(SyncStatus(key="ai_provider", value="gemini"))
    db.add(SyncStatus(key="ai_model", value="gemini-2.5-flash"))
    db.commit()
    provider, model = ai_coach._get_ai_config(db)
    assert provider == "gemini"
    assert model == "gemini-2.5-flash"


def test_call_ai_dispatches_to_claude(db, monkeypatch):
    called = {}

    def fake_claude(context, trigger_type, model):
        called["claude"] = (context, trigger_type, model)
        return ("content", "summary", "category")

    monkeypatch.setattr(ai_coach, "_call_claude", fake_claude)
    result = ai_coach._call_ai(db, "ctx", "activity")
    assert result == ("content", "summary", "category")
    assert "claude" in called


def test_call_ai_dispatches_to_gemini(db, monkeypatch):
    db.add(SyncStatus(key="ai_provider", value="gemini"))
    db.add(SyncStatus(key="ai_model", value="gemini-2.5-flash"))
    db.commit()
    monkeypatch.setattr(ai_coach, "_call_gemini", lambda c, t, m: ("g", "gs", "gc"))
    assert ai_coach._call_ai(db, "ctx", "activity") == ("g", "gs", "gc")


def test_call_claude_uses_anthropic(monkeypatch):
    fake_msg = MagicMock()
    fake_msg.content = [MagicMock(text="**Summary:** ok\nbody")]
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_msg
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda *a, **k: fake_client)

    content, summary, category = ai_coach._call_claude("ctx", "activity", "claude-x")
    assert summary == "ok"
    assert category == "workout_analysis"
    fake_client.messages.create.assert_called_once()


def test_call_gemini_uses_genai(monkeypatch):
    fake_response = MagicMock()
    fake_response.text = "**Summary:** good\nrest"
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = fake_response
    monkeypatch.setattr(ai_coach.genai, "Client", lambda api_key: fake_client)

    content, summary, category = ai_coach._call_gemini("ctx", "daily_summary", "gemini-x")
    assert summary == "good"
    assert category == "recovery"


# --- analyze flows (DB redirected, AI mocked) ---

@pytest.fixture
def stub_ai(monkeypatch):
    monkeypatch.setattr(
        ai_coach, "_call_ai",
        lambda db, ctx, trigger, user_id=1: ("**Summary:** mocked\nDetailed analysis", "mocked", "workout_analysis"),
    )


def test_analyze_activity_creates_insight(db, patch_db_session, stub_ai):
    patch_db_session(ai_coach)
    act = Activity(garmin_id=1, name="Run", activity_type="running",
                   started_at=datetime(2026, 6, 10, 7, 0), duration_sec=3600, distance_m=10000)
    db.add(act)
    db.commit()
    db.refresh(act)

    ai_coach.analyze_activity(act)

    insight = db.query(Insight).filter(Insight.trigger_id == act.id).first()
    assert insight is not None
    assert insight.summary == "mocked"
    db.expire_all()
    assert db.get(Activity, act.id).ai_analyzed is True


def test_analyze_activity_force_replaces_existing(db, patch_db_session, stub_ai):
    patch_db_session(ai_coach)
    act = Activity(garmin_id=2, name="Run", activity_type="running",
                   started_at=datetime(2026, 6, 10, 7, 0), duration_sec=3600)
    db.add(act)
    db.commit()
    db.refresh(act)
    db.add(Insight(trigger_type="activity", trigger_id=act.id, content="stale", summary="stale"))
    db.commit()

    ai_coach.analyze_activity_force(act.id)

    insights = db.query(Insight).filter(Insight.trigger_id == act.id).all()
    assert len(insights) == 1
    assert insights[0].summary == "mocked"


def test_analyze_activity_force_missing_activity_noop(db, patch_db_session, stub_ai):
    patch_db_session(ai_coach)
    ai_coach.analyze_activity_force(999)
    assert db.query(Insight).count() == 0


def test_analyze_activity_with_feedback_appends_feedback(db, patch_db_session, monkeypatch):
    captured = {}

    def fake_call(db_, ctx, trigger, user_id=1):
        captured["ctx"] = ctx
        return ("**Summary:** fb\nbody", "fb", "workout_analysis")

    monkeypatch.setattr(ai_coach, "_call_ai", fake_call)
    patch_db_session(ai_coach)

    act = Activity(garmin_id=3, name="Run", activity_type="running",
                   started_at=datetime(2026, 6, 10, 7, 0), duration_sec=3600,
                   feedback_rating="bad", feedback_tags=json.dumps(["tough_pace"]),
                   feedback_text="legs heavy")
    db.add(act)
    db.commit()
    db.refresh(act)

    ai_coach.analyze_activity_with_feedback(act.id)

    assert "## User Feedback" in captured["ctx"]
    assert "tough_pace" in captured["ctx"]
    assert "legs heavy" in captured["ctx"]
    assert db.query(Insight).filter(Insight.trigger_id == act.id).count() == 1


def test_analyze_daily_summary_creates_insight(db, patch_db_session, stub_ai):
    patch_db_session(ai_coach)
    summary = DailySummary(date=date(2026, 6, 10), steps=10000)
    db.add(summary)
    db.commit()
    db.refresh(summary)

    ai_coach.analyze_daily_summary(summary)

    insight = db.query(Insight).filter(Insight.trigger_type == "daily_summary").first()
    assert insight is not None
    db.expire_all()
    assert db.get(DailySummary, summary.id).ai_analyzed is True


def test_save_error_insight(db, patch_db_session):
    patch_db_session(ai_coach)
    act = Activity(garmin_id=4, name="Run", activity_type="running",
                   started_at=datetime(2026, 6, 10, 7, 0))
    db.add(act)
    db.commit()
    db.refresh(act)

    ai_coach._save_error_insight(act.id, RuntimeError("boom"))

    insight = db.query(Insight).filter(Insight.trigger_id == act.id).first()
    assert insight is not None
    assert "Analysis failed" in insight.content


def test_analyze_activity_force_saves_error_on_failure(db, patch_db_session, monkeypatch):
    patch_db_session(ai_coach)

    def boom(*a, **k):
        raise RuntimeError("ai down")

    monkeypatch.setattr(ai_coach, "_call_ai", boom)
    act = Activity(garmin_id=5, name="Run", activity_type="running",
                   started_at=datetime(2026, 6, 10, 7, 0), duration_sec=3600)
    db.add(act)
    db.commit()
    db.refresh(act)

    ai_coach.analyze_activity_force(act.id)

    insight = db.query(Insight).filter(Insight.trigger_id == act.id).first()
    assert insight is not None
    assert "Analysis failed" in insight.content


def test_build_context_full_sections(db):
    ref = date(2026, 6, 17)
    # Recent activity within 14 days of the reference date.
    db.add(Activity(
        garmin_id=1, name="Easy Run", activity_type="running",
        started_at=datetime(2026, 6, 16, 7, 0), distance_m=8000,
        duration_sec=2400, avg_hr=145, avg_pace_min_km=5.0,
    ))
    # Recovery day.
    db.add(DailySummary(
        date=date(2026, 6, 16), sleep_seconds=27000, resting_hr=48,
        body_battery_high=95, body_battery_low=25, stress_avg=30,
    ))
    # Upcoming race.
    db.add(GarminCalendarEvent(
        garmin_id="r1", event_type="race", date=date(2026, 9, 27),
        title="Marathon", distance_label="Marathon", goal_time_sec=12600, priority="A",
    ))
    # A prior insight to avoid repeating.
    db.add(Insight(trigger_type="activity", trigger_id=1, content="x",
                   summary="Solid aerobic base", category="workout_analysis"))
    # A durable coach memory.
    db.add(CoachMemory(user_id=1, category="niggle", tag="knee pain", note="Sore after long runs.", active=True))
    db.commit()

    context = ai_coach._build_context(db, "activity", "Trigger data", reference_date=ref)
    assert "## Current Data" in context
    assert "## Recent Activities (14 days)" in context
    assert "Easy Run" in context
    assert "## Weekly Volume (last 8 weeks)" in context
    assert "## Recent Recovery (7 days)" in context
    assert "## Upcoming Races" in context
    assert "Marathon" in context
    assert "## Recent Insights (avoid repeating these)" in context
    assert "Solid aerobic base" in context
    assert "## What The Coach Remembers" in context
    assert "[niggle] knee pain: Sore after long runs." in context


def test_weekly_review_generates_insight(db, patch_db_session, monkeypatch):
    patch_db_session(ai_coach)
    monkeypatch.setattr(
        ai_coach, "_call_ai",
        lambda d, c, t, user_id=1: ("**Summary:** week done\nbody", "week done", "training_plan"),
    )
    # An activity within the last 7 days of today() so weekly_review picks it up.
    from datetime import timedelta
    db.add(Activity(
        garmin_id=1, name="Run", activity_type="running",
        started_at=datetime.combine(date.today() - timedelta(days=2), datetime.min.time()),
        duration_sec=3600, distance_m=10000,
    ))
    db.commit()

    ai_coach.weekly_review()

    insight = db.query(Insight).filter(Insight.trigger_type == "weekly_review").first()
    assert insight is not None
    assert insight.category == "training_plan"


def test_weekly_review_no_activities_skips(db, patch_db_session, monkeypatch):
    patch_db_session(ai_coach)
    called = MagicMock()
    monkeypatch.setattr(ai_coach, "_call_ai", called)
    ai_coach.weekly_review()
    called.assert_not_called()
    assert db.query(Insight).count() == 0


# --- _build_plan_adherence_context (P0-3) ---

def _seed_plan(db, week_start: date) -> TrainingPlan:
    plan = TrainingPlan(
        generated_at=datetime(2026, 6, 9, 9, 0, tzinfo=timezone.utc),
        week_start=week_start,
        plan_weeks=1,
        phase="build",
        overview="Test plan",
    )
    db.add(plan)
    db.flush()
    return plan


def test_plan_adherence_no_plan_returns_none(db):
    result = ai_coach._build_plan_adherence_context(db, date(2026, 6, 21))
    assert result is None


def test_plan_adherence_no_past_days_returns_none(db):
    # Plan starts today — no past days yet.
    plan = _seed_plan(db, date(2026, 6, 21))
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 21), day_of_week="Sunday",
        week_number=1, workout_type="long", target_distance_m=20000,
    ))
    db.commit()
    result = ai_coach._build_plan_adherence_context(db, date(2026, 6, 21))
    assert result is None


def test_plan_adherence_rest_days_excluded(db):
    plan = _seed_plan(db, date(2026, 6, 16))
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 16), day_of_week="Monday",
        week_number=1, workout_type="rest",
    ))
    db.commit()
    result = ai_coach._build_plan_adherence_context(db, date(2026, 6, 21))
    assert result is None


def test_plan_adherence_completed_session(db):
    ref = date(2026, 6, 21)
    plan = _seed_plan(db, date(2026, 6, 16))
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 16), day_of_week="Monday",
        week_number=1, workout_type="easy", target_distance_m=9000,
    ))
    # Matching activity on the planned date.
    db.add(Activity(
        garmin_id=10, name="Easy Run", activity_type="running",
        started_at=datetime(2026, 6, 16, 7, 0), distance_m=9500,
    ))
    db.commit()

    result = ai_coach._build_plan_adherence_context(db, ref)

    assert result is not None
    assert "Completed: 1/1" in result
    assert "100%" in result
    assert "COMPLETED" in result
    assert "2026-06-16" in result
    assert "[easy]" in result
    # Distance note included because target_distance_m is set.
    assert "planned 9.0 km" in result


def test_plan_adherence_missed_session(db):
    ref = date(2026, 6, 21)
    plan = _seed_plan(db, date(2026, 6, 16))
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 17), day_of_week="Tuesday",
        week_number=1, workout_type="interval", target_distance_m=10000,
    ))
    db.commit()

    result = ai_coach._build_plan_adherence_context(db, ref)

    assert result is not None
    assert "Completed: 0/1" in result
    assert "0%" in result
    assert "MISSED" in result
    assert "2026-06-17" in result
    assert "[interval]" in result


def test_plan_adherence_mixed_sessions(db):
    ref = date(2026, 6, 21)
    plan = _seed_plan(db, date(2026, 6, 16))
    # Day 1: completed with activity
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 16), day_of_week="Monday",
        week_number=1, workout_type="easy", target_distance_m=9000,
    ))
    db.add(Activity(
        garmin_id=11, name="Easy Run", activity_type="running",
        started_at=datetime(2026, 6, 16, 8, 0), distance_m=9000,
    ))
    # Day 2: missed
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 17), day_of_week="Tuesday",
        week_number=1, workout_type="tempo", target_distance_m=12000,
    ))
    # Day 3: completed, no target distance
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 18), day_of_week="Wednesday",
        week_number=1, workout_type="easy",
    ))
    db.add(Activity(
        garmin_id=12, name="Easy Run 2", activity_type="running",
        started_at=datetime(2026, 6, 18, 7, 0), distance_m=8000,
    ))
    db.commit()

    result = ai_coach._build_plan_adherence_context(db, ref)

    assert result is not None
    assert "Completed: 2/3" in result
    assert "67%" in result
    assert "COMPLETED" in result
    assert "MISSED" in result


def test_build_plan_context_includes_adherence(db):
    ref = date(2026, 6, 21)
    plan = _seed_plan(db, date(2026, 6, 16))
    db.add(TrainingPlanDay(
        plan_id=plan.id, day_date=date(2026, 6, 17), day_of_week="Tuesday",
        week_number=1, workout_type="tempo", target_distance_m=11000,
    ))
    db.add(Activity(
        garmin_id=20, name="Tempo Run", activity_type="running",
        started_at=datetime(2026, 6, 17, 7, 0), distance_m=11000,
    ))
    db.commit()

    context = ai_coach._build_plan_context(db, ref)

    assert "## Current Plan Adherence" in context
    assert "COMPLETED" in context
    assert "Completed: 1/1" in context


def test_build_plan_context_no_adherence_when_no_plan(db):
    context = ai_coach._build_plan_context(db, date(2026, 6, 21))
    assert "## Current Plan Adherence" not in context


# --- detect_plan_realignment ---

def _seed_plan_with_days(db, plan_start, days_config):
    """Seed a TrainingPlan with specified day configs [{date, workout_type, dist_m}]."""
    plan = TrainingPlan(
        generated_at=datetime(2026, 6, 1, 0, 0, tzinfo=timezone.utc),
        week_start=plan_start,
        plan_weeks=4,
    )
    db.add(plan)
    db.flush()
    for cfg in days_config:
        db.add(TrainingPlanDay(
            plan_id=plan.id,
            day_date=cfg["date"],
            day_of_week=cfg["date"].strftime("%A"),
            week_number=1,
            workout_type=cfg.get("workout_type", "easy"),
            target_distance_m=cfg.get("dist_m"),
        ))
    db.commit()
    return plan


def test_detect_realignment_no_plan(db):
    ref = date(2026, 6, 21)
    result = ai_coach.detect_plan_realignment(db, ref)
    assert result["should_prompt"] is False
    assert result["missed_count"] == 0
    assert result["missed_sessions"] == []


def test_detect_realignment_below_threshold(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "easy", "dist_m": 8000},
    ])
    result = ai_coach.detect_plan_realignment(db, ref)
    # 1 missed < threshold of 2
    assert result["should_prompt"] is False
    assert result["missed_count"] == 1
    assert result["total_scheduled"] == 1


def test_detect_realignment_at_threshold(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "easy"},
        {"date": date(2026, 6, 18), "workout_type": "tempo"},
    ])
    result = ai_coach.detect_plan_realignment(db, ref)
    assert result["should_prompt"] is True
    assert result["missed_count"] == 2
    assert result["total_scheduled"] == 2
    assert len(result["missed_sessions"]) == 2


def test_detect_realignment_rest_days_excluded(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "rest"},
        {"date": date(2026, 6, 18), "workout_type": "rest"},
        {"date": date(2026, 6, 19), "workout_type": "rest"},
    ])
    result = ai_coach.detect_plan_realignment(db, ref)
    # Only rest days → no scheduled workout sessions
    assert result["should_prompt"] is False
    assert result["missed_count"] == 0
    assert result["total_scheduled"] == 0


def test_detect_realignment_completed_sessions_reduce_count(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "easy", "dist_m": 8000},
        {"date": date(2026, 6, 18), "workout_type": "tempo", "dist_m": 10000},
        {"date": date(2026, 6, 19), "workout_type": "interval", "dist_m": 12000},
    ])
    # Complete only the first session
    db.add(Activity(
        garmin_id=501, name="Easy Run", activity_type="running",
        started_at=datetime(2026, 6, 17, 8, 0), distance_m=8200,
    ))
    db.commit()
    result = ai_coach.detect_plan_realignment(db, ref)
    assert result["total_scheduled"] == 3
    assert result["missed_count"] == 2
    assert result["should_prompt"] is True


def test_detect_realignment_dismissed_suppresses_prompt(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "easy"},
        {"date": date(2026, 6, 18), "workout_type": "tempo"},
    ])
    # Simulate dismiss: set snooze date to future
    db.add(SyncStatus(key="plan_realignment_dismissed_until", value="2026-06-28"))
    db.commit()
    result = ai_coach.detect_plan_realignment(db, ref)
    assert result["should_prompt"] is False
    assert result["missed_count"] == 2  # still detected, just suppressed


def test_detect_realignment_expired_dismiss_prompts(db):
    ref = date(2026, 6, 21)
    _seed_plan_with_days(db, date(2026, 6, 16), [
        {"date": date(2026, 6, 17), "workout_type": "easy"},
        {"date": date(2026, 6, 18), "workout_type": "tempo"},
    ])
    # Dismiss expired in the past
    db.add(SyncStatus(key="plan_realignment_dismissed_until", value="2026-06-14"))
    db.commit()
    result = ai_coach.detect_plan_realignment(db, ref)
    assert result["should_prompt"] is True


# --- generate_training_plan – P1-3 structured output ---

def _minimal_plan_dict(week_start: date) -> dict:
    """Smallest valid plan dict: 4 rest weeks starting from week_start."""
    from datetime import timedelta
    weeks = []
    for w in range(4):
        days = []
        for d in range(7):
            day = week_start + timedelta(days=w * 7 + d)
            days.append({
                "date": day.isoformat(),
                "day_of_week": day.strftime("%A"),
                "workout_type": "rest",
                "description": "Rest day",
                "notes": None,
                "target_distance_km": None,
                "target_pace_display": None,
            })
        weeks.append({"week_number": w + 1, "theme": "Base", "notes": "Easy week", "days": days})
    return {"phase": "base", "overview": "Test plan overview", "weeks": weeks}


def test_generate_training_plan_claude_tool_use(db, patch_db_session, monkeypatch):
    """Claude path: plan_data is extracted from the tool_use block; no JSON parsing needed."""
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)  # next Monday after 2026-07-03
    plan_dict = _minimal_plan_dict(week_start)

    tool_block = MagicMock()
    tool_block.type = "tool_use"
    tool_block.name = "generate_plan"
    tool_block.input = plan_dict

    mock_response = MagicMock()
    mock_response.content = [tool_block]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    monkeypatch.setattr(ai_coach, "_get_ai_config", lambda db, user_id=1: ("claude", "claude-sonnet-4-6"))
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda **kw: mock_client)

    result = ai_coach.generate_training_plan(reference_date=date(2026, 7, 3))

    assert result is not None
    assert result.phase == "base"
    assert result.plan_weeks == 4
    # raw_json is the serialised tool input, not a free-text response
    assert result.raw_json == json.dumps(plan_dict)

    kwargs = mock_client.messages.create.call_args[1]
    assert "tools" in kwargs
    assert kwargs["tool_choice"] == {"type": "tool", "name": "generate_plan"}
    assert kwargs["max_tokens"] == ai_coach._PLAN_MAX_TOKENS


def test_generate_training_plan_gemini_structured_output(db, patch_db_session, monkeypatch):
    """Gemini path: response_schema + response_mime_type enforce schema-valid JSON."""
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _minimal_plan_dict(week_start)
    plan_json = json.dumps(plan_dict)

    mock_response = MagicMock()
    mock_response.text = plan_json

    mock_models = MagicMock()
    mock_models.generate_content.return_value = mock_response

    mock_gemini_client = MagicMock()
    mock_gemini_client.models = mock_models

    monkeypatch.setattr(ai_coach, "_get_ai_config", lambda db, user_id=1: ("gemini", "gemini-2.5-flash"))
    monkeypatch.setattr(ai_coach.genai, "Client", lambda **kw: mock_gemini_client)

    result = ai_coach.generate_training_plan(reference_date=date(2026, 7, 3))

    assert result is not None
    assert result.phase == "base"
    assert result.plan_weeks == 4

    kwargs = mock_models.generate_content.call_args[1]
    config = kwargs["config"]
    assert config.response_mime_type == "application/json"
    assert config.response_schema is not None


def test_generate_training_plan_claude_text_fallback(db, patch_db_session, monkeypatch):
    """When Claude returns plain text (no tool call), _parse_plan_json is used as fallback."""
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _minimal_plan_dict(week_start)
    plan_json = json.dumps(plan_dict)

    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = plan_json
    # Ensure hasattr(block, "text") returns True (MagicMock does this by default)

    mock_response = MagicMock()
    mock_response.content = [text_block]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    monkeypatch.setattr(ai_coach, "_get_ai_config", lambda db, user_id=1: ("claude", "claude-sonnet-4-6"))
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda **kw: mock_client)

    result = ai_coach.generate_training_plan(reference_date=date(2026, 7, 3))

    assert result is not None
    assert result.phase == "base"
    assert result.plan_weeks == 4


def test_generate_training_plan_exception_returns_none(db, patch_db_session, monkeypatch):
    """Any unexpected exception during generation returns None without raising."""
    patch_db_session(ai_coach)

    def _raise(*a, **kw):
        raise RuntimeError("unexpected boom")

    monkeypatch.setattr(ai_coach, "_get_ai_config", _raise)

    result = ai_coach.generate_training_plan(reference_date=date(2026, 7, 3))

    assert result is None


# --- P2-2: strength routine_id storage ---

def _plan_dict_with_strength(week_start: date, routine_id: str | None) -> dict:
    """Plan dict with one strength day (week 1, day 1) that has a routine_id."""
    from datetime import timedelta
    weeks = []
    for w in range(4):
        days = []
        for d in range(7):
            day = week_start + timedelta(days=w * 7 + d)
            wtype = "rest"
            rid = None
            if w == 0 and d == 0:
                wtype = "strength"
                rid = routine_id
            days.append({
                "date": day.isoformat(),
                "day_of_week": day.strftime("%A"),
                "workout_type": wtype,
                "description": "Strength session" if wtype == "strength" else "Rest day",
                "notes": None,
                "target_distance_km": None,
                "target_pace_display": None,
                "routine_id": rid,
            })
        weeks.append({"week_number": w + 1, "theme": "Base", "notes": "Easy week", "days": days})
    return {"phase": "base", "overview": "Test", "weeks": weeks}


def test_store_training_plan_saves_valid_routine_id(db, patch_db_session):
    """_store_training_plan stores a valid routine_id on the strength day."""
    from app.models import TrainingPlanDay
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _plan_dict_with_strength(week_start, "running-base")
    plan = ai_coach._store_training_plan(db, plan_dict, week_start, "{}", user_id=1)

    strength_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.plan_id == plan.id, TrainingPlanDay.workout_type == "strength")
        .first()
    )
    assert strength_day is not None
    assert strength_day.routine_id == "running-base"


def test_store_training_plan_ignores_unknown_routine_id(db, patch_db_session):
    """_store_training_plan discards routine_id values not in the library."""
    from app.models import TrainingPlanDay
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _plan_dict_with_strength(week_start, "not-a-real-routine")
    plan = ai_coach._store_training_plan(db, plan_dict, week_start, "{}", user_id=1)

    strength_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.plan_id == plan.id, TrainingPlanDay.workout_type == "strength")
        .first()
    )
    assert strength_day is not None
    assert strength_day.routine_id is None


def test_store_training_plan_handles_null_routine_id(db, patch_db_session):
    """_store_training_plan stores None when routine_id is null in the plan dict."""
    from app.models import TrainingPlanDay
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _plan_dict_with_strength(week_start, None)
    plan = ai_coach._store_training_plan(db, plan_dict, week_start, "{}", user_id=1)

    strength_day = (
        db.query(TrainingPlanDay)
        .filter(TrainingPlanDay.plan_id == plan.id, TrainingPlanDay.workout_type == "strength")
        .first()
    )
    assert strength_day is not None
    assert strength_day.routine_id is None


def test_plan_system_prompt_includes_routine_catalog():
    """_PLAN_SYSTEM_PROMPT should contain all routine IDs from the library."""
    from app.strength_routines import ROUTINE_IDS
    for rid in ROUTINE_IDS:
        assert rid in ai_coach._PLAN_SYSTEM_PROMPT


def test_plan_tool_schema_includes_routine_id():
    """_PLAN_TOOL_SCHEMA day items should declare routine_id."""
    day_props = (
        ai_coach._PLAN_TOOL_SCHEMA["input_schema"]["properties"]["weeks"]["items"]
        ["properties"]["days"]["items"]["properties"]
    )
    assert "routine_id" in day_props


# ---------------------------------------------------------------------------
# Chat tool-use (P0-2)
# ---------------------------------------------------------------------------

def test_generate_training_plan_with_note_appends_to_prompt(db, patch_db_session, monkeypatch):
    """A note (e.g. from chat's adjust_upcoming_week) is folded into the plan prompt."""
    patch_db_session(ai_coach)

    week_start = date(2026, 7, 7)
    plan_dict = _minimal_plan_dict(week_start)

    tool_block = MagicMock()
    tool_block.type = "tool_use"
    tool_block.name = "generate_plan"
    tool_block.input = plan_dict

    mock_response = MagicMock()
    mock_response.content = [tool_block]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    monkeypatch.setattr(ai_coach, "_get_ai_config", lambda db, user_id=1: ("claude", "claude-sonnet-4-6"))
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda **kw: mock_client)

    result = ai_coach.generate_training_plan(reference_date=date(2026, 7, 3), note="travelling next week")

    assert result is not None
    prompt = mock_client.messages.create.call_args[1]["messages"][0]["content"]
    assert "travelling next week" in prompt


# --- _dispatch_chat_tool ---

def test_dispatch_chat_tool_regenerate_plan(db, patch_db_session):
    patch_db_session(ai_coach)

    result, action = ai_coach._dispatch_chat_tool(db, 1, "regenerate_plan", {})

    assert result["status"] == "queued"
    job = db.query(AIJob).filter(AIJob.id == result["job_id"]).first()
    assert job is not None
    assert job.task_type == "generate_plan"
    assert json.loads(job.payload_json) == {}
    assert action["type"] == "regenerate_plan"
    assert action["job_id"] == job.id


def test_dispatch_chat_tool_adjust_upcoming_week(db, patch_db_session):
    patch_db_session(ai_coach)

    result, action = ai_coach._dispatch_chat_tool(
        db, 1, "adjust_upcoming_week", {"reason": "travelling for work"}
    )

    assert result["status"] == "queued"
    job = db.query(AIJob).filter(AIJob.id == result["job_id"]).first()
    assert job is not None
    assert job.task_type == "generate_plan"
    assert json.loads(job.payload_json) == {"note": "travelling for work"}
    assert "travelling for work" in action["summary"]


def test_dispatch_chat_tool_mark_setback(db):
    result, action = ai_coach._dispatch_chat_tool(
        db, 1, "mark_setback", {"tag": "knee pain", "note": "Sore after long runs."}
    )

    assert result == {"status": "recorded"}
    insight = db.query(Insight).filter(Insight.trigger_type == "chat_setback").first()
    assert insight is not None
    assert insight.user_id == 1
    assert insight.summary == "knee pain"
    assert insight.content == "Sore after long runs."
    assert insight.category == "setback"
    memory = db.query(CoachMemory).filter(CoachMemory.user_id == 1).first()
    assert memory is not None
    assert memory.category == "niggle"
    assert memory.tag == "knee pain"
    assert memory.note == "Sore after long runs."
    assert memory.active is True
    assert action["type"] == "mark_setback"
    assert action["job_id"] is None


def test_dispatch_chat_tool_explain_workout_found(db):
    plan = TrainingPlan(generated_at=datetime(2026, 6, 1, tzinfo=timezone.utc), week_start=date(2026, 6, 15), plan_weeks=4)
    db.add(plan)
    db.flush()
    db.add(TrainingPlanDay(
        plan_id=plan.id,
        day_date=date(2026, 6, 18),
        day_of_week="Thursday",
        week_number=1,
        workout_type="tempo",
        target_distance_m=8000,
        target_pace_display="4:30/km",
        description="Tempo run with 20min at threshold.",
    ))
    db.commit()

    result, action = ai_coach._dispatch_chat_tool(db, 1, "explain_workout", {"date": "2026-06-18"})

    assert result["status"] == "ok"
    assert result["workout_type"] == "tempo"
    assert result["target_distance_km"] == 8.0
    assert result["description"] == "Tempo run with 20min at threshold."
    assert action is None


def test_dispatch_chat_tool_explain_workout_not_found(db):
    result, action = ai_coach._dispatch_chat_tool(db, 1, "explain_workout", {"date": "2026-06-18"})
    assert result == {"status": "not_found", "date": "2026-06-18"}
    assert action is None


def test_dispatch_chat_tool_explain_workout_invalid_date(db):
    result, action = ai_coach._dispatch_chat_tool(db, 1, "explain_workout", {"date": "not-a-date"})
    assert result["status"] == "invalid_date"
    assert action is None


def test_dispatch_chat_tool_unknown_raises(db):
    with pytest.raises(ValueError):
        ai_coach._dispatch_chat_tool(db, 1, "delete_everything", {})


# --- _format_upcoming_plan_context ---

def test_format_upcoming_plan_context_lists_next_7_days(db):
    from datetime import timedelta
    plan = TrainingPlan(generated_at=datetime(2026, 6, 1, tzinfo=timezone.utc), week_start=date(2026, 6, 15), plan_weeks=4)
    db.add(plan)
    db.flush()
    today = date.today()
    db.add(TrainingPlanDay(
        plan_id=plan.id,
        day_date=today + timedelta(days=1),
        day_of_week="X",
        week_number=1,
        workout_type="easy",
        description="Easy 5k",
    ))
    db.commit()

    out = ai_coach._format_upcoming_plan_context(db, 1)
    assert "Upcoming Plan This Week" in out
    assert "easy" in out
    assert "Easy 5k" in out


def test_format_upcoming_plan_context_empty_when_no_plan(db):
    assert ai_coach._format_upcoming_plan_context(db, 1) == ""


# --- _stream_claude tool-use streaming ---

class _FakeClaudeStream:
    def __init__(self, events, final_message):
        self._events = events
        self._final_message = final_message

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def __iter__(self):
        return iter(self._events)

    def get_final_message(self):
        return self._final_message


def _text_delta_event(text):
    return SimpleNamespace(
        type="content_block_delta",
        delta=SimpleNamespace(type="text_delta", text=text),
    )


def test_stream_claude_plain_text_no_tool_call(db, monkeypatch):
    events = [_text_delta_event("Hello"), _text_delta_event(" there")]
    final_message = SimpleNamespace(content=[SimpleNamespace(type="text", text="Hello there")])

    mock_client = MagicMock()
    mock_client.messages.stream.return_value = _FakeClaudeStream(events, final_message)
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda **kw: mock_client)

    events_out = list(ai_coach._stream_claude([], "system", "claude-sonnet-4-6", db, 1))

    assert events_out == [
        {"type": "token", "text": "Hello"},
        {"type": "token", "text": " there"},
    ]
    assert mock_client.messages.stream.call_count == 1


def test_stream_claude_tool_use_dispatches_and_streams_confirmation(db, patch_db_session, monkeypatch):
    patch_db_session(ai_coach)

    tool_use_block = SimpleNamespace(type="tool_use", name="regenerate_plan", input={}, id="tu_1")
    first_final = SimpleNamespace(content=[tool_use_block])
    first_stream = _FakeClaudeStream([], first_final)

    confirmation_events = [_text_delta_event("Regenerating"), _text_delta_event(" now.")]
    second_final = SimpleNamespace(content=[SimpleNamespace(type="text", text="Regenerating now.")])
    second_stream = _FakeClaudeStream(confirmation_events, second_final)

    mock_client = MagicMock()
    mock_client.messages.stream.side_effect = [first_stream, second_stream]
    monkeypatch.setattr(ai_coach.anthropic, "Anthropic", lambda **kw: mock_client)

    events_out = list(ai_coach._stream_claude([], "system", "claude-sonnet-4-6", db, 1))

    assert mock_client.messages.stream.call_count == 2
    action_events = [e for e in events_out if e["type"] == "action"]
    token_events = [e for e in events_out if e["type"] == "token"]
    assert len(action_events) == 1
    assert action_events[0]["action"]["type"] == "regenerate_plan"
    assert "".join(e["text"] for e in token_events) == "Regenerating now."

    job = db.query(AIJob).filter(AIJob.task_type == "generate_plan").first()
    assert job is not None

    # First call carries tools; the follow-up confirmation call does not.
    first_kwargs = mock_client.messages.stream.call_args_list[0][1]
    second_kwargs = mock_client.messages.stream.call_args_list[1][1]
    assert "tools" in first_kwargs
    assert "tools" not in second_kwargs
    assert second_kwargs["messages"][-1]["content"][0]["type"] == "tool_result"


# --- _stream_gemini tool-use streaming ---

def _gemini_text_chunk(text):
    return SimpleNamespace(text=text, candidates=[])


def _gemini_function_call_chunk(name, args):
    part = SimpleNamespace(function_call=SimpleNamespace(name=name, args=args))
    candidate = SimpleNamespace(content=SimpleNamespace(parts=[part]))
    return SimpleNamespace(text=None, candidates=[candidate])


def test_stream_gemini_plain_text_no_tool_call(db, monkeypatch):
    chunks = [_gemini_text_chunk("Hi"), _gemini_text_chunk(" there")]
    mock_models = MagicMock()
    mock_models.generate_content_stream.return_value = chunks
    mock_client = MagicMock()
    mock_client.models = mock_models
    monkeypatch.setattr(ai_coach.genai, "Client", lambda **kw: mock_client)

    events_out = list(ai_coach._stream_gemini([], "system", "gemini-2.5-flash", db, 1))

    assert events_out == [
        {"type": "token", "text": "Hi"},
        {"type": "token", "text": " there"},
    ]
    assert mock_models.generate_content_stream.call_count == 1


def test_stream_gemini_tool_use_dispatches_and_streams_confirmation(db, monkeypatch):
    chunks_first = [_gemini_function_call_chunk("mark_setback", {"tag": "knee pain", "note": "sore"})]
    chunks_second = [_gemini_text_chunk("Noted, take it easy.")]

    mock_models = MagicMock()
    mock_models.generate_content_stream.side_effect = [chunks_first, chunks_second]
    mock_client = MagicMock()
    mock_client.models = mock_models
    monkeypatch.setattr(ai_coach.genai, "Client", lambda **kw: mock_client)

    events_out = list(ai_coach._stream_gemini([], "system", "gemini-2.5-flash", db, 1))

    assert mock_models.generate_content_stream.call_count == 2
    action_events = [e for e in events_out if e["type"] == "action"]
    token_events = [e for e in events_out if e["type"] == "token"]
    assert len(action_events) == 1
    assert action_events[0]["action"]["type"] == "mark_setback"
    assert "".join(e["text"] for e in token_events) == "Noted, take it easy."

    insight = db.query(Insight).filter(Insight.trigger_type == "chat_setback").first()
    assert insight is not None
    assert insight.summary == "knee pain"
