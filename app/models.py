from datetime import datetime, date, timezone

from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    Float,
    Text,
    Boolean,
    DateTime,
    Date,
    String,
    UniqueConstraint,
)

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


# The primary/bootstrap user. The app began life single-tenant; Phase 3 keys
# every data row on a user, defaulting unscoped writes to this id and
# backfilling all pre-existing rows to it. Production read/write paths (API,
# scheduler) always pass an explicit user, so this default only ever applies to
# the single-tenant bootstrap account and the test suite.
DEFAULT_USER_ID = 1


def _user_id_column():
    """A per-user scoping column shared by every data table.

    Following the codebase convention (e.g. ``TrainingPlanDay.plan_id``), this is
    a plain indexed integer rather than a DB-level ``ForeignKey`` — SQLite can't
    add FKs via ``ALTER TABLE`` and the app enforces the relationship in code.
    """
    return Column(Integer, nullable=False, default=DEFAULT_USER_ID, index=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    # Per-user Garmin data-source credentials (Phase 2). The password is stored
    # as Fernet ciphertext (see app/crypto.py); OAuth tokens live on disk under
    # ``{garmin_token_dir}/{user_id}/``.
    garmin_email = Column(String(255), nullable=True)
    garmin_password_encrypted = Column(Text, nullable=True)

    # Set when a background sync can't authenticate (tokens gone/expired and the
    # account needs an interactive MFA code a cron can't supply). The Settings UI
    # surfaces a "Reconnect" action; reconnecting clears the flag. (Phase 3)
    garmin_needs_reauth = Column(Boolean, default=False, nullable=False)


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        UniqueConstraint("user_id", "garmin_id", name="uq_activities_user_garmin"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    garmin_id = Column(BigInteger, nullable=False, index=True)
    activity_type = Column(Text)
    name = Column(Text)
    started_at = Column(DateTime, index=True)
    duration_sec = Column(Float)
    distance_m = Column(Float)
    avg_hr = Column(Integer)
    max_hr = Column(Integer)
    avg_pace_min_km = Column(Float)
    calories = Column(Float)
    elevation_gain = Column(Float)
    elevation_loss = Column(Float)
    avg_cadence = Column(Float)
    avg_stride = Column(Float)
    training_effect_aerobic = Column(Float)
    training_effect_anaerobic = Column(Float)
    vo2max = Column(Float)
    avg_power = Column(Float)
    laps_json = Column(Text)
    splits_json = Column(Text)
    hr_zones_json = Column(Text)
    weather_json = Column(Text)
    raw_json = Column(Text)
    synced_at = Column(DateTime, default=_utcnow)
    ai_analyzed = Column(Boolean, default=False)

    # Running Dynamics
    avg_ground_contact_time = Column(Float)
    avg_vertical_oscillation = Column(Float)
    avg_vertical_ratio = Column(Float)

    # Power Metrics
    normalized_power = Column(Float)
    training_stress_score = Column(Float)
    intensity_factor = Column(Float)

    # Respiration
    avg_respiration_rate = Column(Float)
    max_respiration_rate = Column(Float)

    # Speed
    avg_speed = Column(Float)
    max_speed = Column(Float)

    # Heart Rate
    min_hr = Column(Integer)

    # Elevation
    max_elevation = Column(Float)
    min_elevation = Column(Float)

    # Run/Walk
    max_cadence = Column(Float)
    run_time_sec = Column(Float)
    walk_time_sec = Column(Float)

    # Extended JSON data
    typed_splits_json = Column(Text)
    power_zones_json = Column(Text)

    # Mean-maximal curves (best sustained power / GAP-speed / HR per duration),
    # computed from the per-sample detail streams. See app/streams.py.
    mean_max_json = Column(Text)

    # Aerobic coupling metrics derived from aligned pace/power + HR streams.
    # decoupling_pct: Pa:HR drift between first and second half (< 5% = well coupled).
    # efficiency_factor: avg GAP-speed / avg HR in m/s per bpm.
    decoupling_pct = Column(Float, nullable=True)
    efficiency_factor = Column(Float, nullable=True)

    # User feedback
    feedback_rating = Column(String(10), nullable=True)   # "good" or "bad"
    feedback_tags = Column(Text, nullable=True)            # JSON array of setback tags
    feedback_text = Column(Text, nullable=True)            # optional custom text


class DailySummary(Base):
    __tablename__ = "daily_summaries"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_summaries_user_date"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    date = Column(Date, nullable=False, index=True)
    steps = Column(Integer)
    total_calories = Column(Integer)
    active_calories = Column(Integer)
    resting_hr = Column(Integer)
    max_hr = Column(Integer)
    stress_avg = Column(Integer)
    sleep_seconds = Column(Integer)
    sleep_score = Column(Float)
    body_battery_high = Column(Integer)
    body_battery_low = Column(Integer)
    intensity_minutes = Column(Integer)
    floors_climbed = Column(Integer)
    # Overnight HRV (heart-rate variability), attributed to the wake-up day
    hrv_avg = Column(Float)              # last-night average HRV (ms)
    hrv_weekly_avg = Column(Float)       # personal 7-day baseline (ms)
    hrv_status = Column(String(20))      # BALANCED / UNBALANCED / LOW / POOR
    raw_json = Column(Text)
    synced_at = Column(DateTime, default=_utcnow)
    ai_analyzed = Column(Boolean, default=False)


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    created_at = Column(DateTime, default=_utcnow, index=True)
    trigger_type = Column(Text)  # activity, daily_summary, weekly_review
    trigger_id = Column(Integer, nullable=True)
    content = Column(Text)
    summary = Column(Text)
    category = Column(Text)  # workout_analysis, recovery, training_plan, trend, recommendation


class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    name = Column(Text, nullable=False)
    date = Column(Date, nullable=False, index=True)
    distance_m = Column(Float)
    distance_label = Column(Text)  # 5K, 10K, Half Marathon, Marathon, custom
    goal_time_sec = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


class GarminCalendarEvent(Base):
    __tablename__ = "garmin_calendar_events"
    __table_args__ = (
        UniqueConstraint("user_id", "garmin_id", name="uq_garmin_calendar_user_garmin"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    garmin_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # "race", "workout"
    date = Column(Date, nullable=False, index=True)
    title = Column(Text)
    distance_m = Column(Float, nullable=True)
    distance_label = Column(Text, nullable=True)
    goal_time_sec = Column(Integer, nullable=True)
    priority = Column(String(1), nullable=True)  # A, B, C (races only)
    workout_type = Column(Text, nullable=True)
    workout_description = Column(Text, nullable=True)
    raw_json = Column(Text)
    synced_at = Column(DateTime, default=_utcnow)
    projected_race_time_sec = Column(Integer, nullable=True)  # Garmin projected finish
    predicted_race_time_sec = Column(Integer, nullable=True)  # Garmin predicted finish


class MetricZone(Base):
    __tablename__ = "metric_zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_key = Column(String(50), nullable=False, index=True)
    zone_name = Column(String(20), nullable=False)
    zone_color = Column(String(20), nullable=False)
    percentile_label = Column(String(20), nullable=False)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)


class SyncStatus(Base):
    __tablename__ = "sync_status"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_sync_status_user_key"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    key = Column(String(100), nullable=False)
    value = Column(Text)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class AthleteProfile(Base):
    """Single-athlete profile feeding personalization and the AI context.

    One row per user (Phase 3), looked up by ``user_id``.
    """

    __tablename__ = "athlete_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_athlete_profiles_user"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    name = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    weight_kg = Column(Float, nullable=True)
    goal_race = Column(Text, nullable=True)
    goal_race_date = Column(Date, nullable=True)
    threshold_pace_min_km = Column(Float, nullable=True)
    threshold_hr = Column(Integer, nullable=True)
    threshold_power = Column(Integer, nullable=True)
    max_hr = Column(Integer, nullable=True)
    resting_hr = Column(Integer, nullable=True)
    injury_history = Column(Text, nullable=True)
    weekly_availability = Column(Text, nullable=True)
    training_preferences = Column(Text, nullable=True)
    # Structured plan preferences (set via onboarding / plan-setup UI)
    training_volume = Column(Text, nullable=True)    # gradual | steady | progressive
    difficulty = Column(Text, nullable=True)          # comfortable | balanced | challenging
    running_ability = Column(Text, nullable=True)    # beginner | intermediate | advanced | elite
    elevation_profile = Column(Text, nullable=True)  # flat | rolling | moderate | hilly
    weekly_mileage_km = Column(Float, nullable=True)
    longest_run_km = Column(Float, nullable=True)
    runs_per_week = Column(Integer, nullable=True)
    available_days = Column(Text, nullable=True)      # JSON array e.g. '["Mon","Wed","Sun"]'
    long_run_day = Column(Text, nullable=True)        # e.g. "Sunday"
    race_times_json = Column(Text, nullable=True)    # JSON obj e.g. '{"marathon":"4:06:10"}'
    target_weekly_km = Column(Float, nullable=True)  # target km/week for the plan
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class ZoneConfig(Base):
    """Custom threshold-anchored zones for HR, pace, and power.

    Boundaries are stored as percentages of the relevant threshold value
    (threshold_hr, threshold_pace_min_km, or threshold_power from AthleteProfile).
    min_pct=None means no lower bound; max_pct=None means no upper bound.
    For pace zones a higher percentage means a slower (easier) pace.
    """

    __tablename__ = "zone_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    zone_type = Column(String(20), nullable=False, index=True)  # "hr", "pace", "power"
    zone_number = Column(Integer, nullable=False)               # 1–5
    zone_name = Column(String(50), nullable=False)
    zone_color = Column(String(20), nullable=False)
    min_pct = Column(Float, nullable=True)   # lower % of threshold (null = no lower bound)
    max_pct = Column(Float, nullable=True)   # upper % of threshold (null = no upper bound)

    __table_args__ = (
        UniqueConstraint("user_id", "zone_type", "zone_number", name="uq_zone_type_number"),
    )


class TrainingPlan(Base):
    """AI-generated periodized training plan.

    At most one active plan exists at a time (identified by the latest
    ``generated_at``). Older plans are retained for comparison.
    """

    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    generated_at = Column(DateTime, default=_utcnow, index=True)
    week_start = Column(Date, nullable=False)   # Monday of week 1
    plan_weeks = Column(Integer, default=4)
    phase = Column(Text, nullable=True)          # base, build, peak, taper
    overview = Column(Text, nullable=True)        # AI narrative overview
    raw_json = Column(Text, nullable=True)        # full AI JSON output


class AIJob(Base):
    """Persisted job ledger for durable AI task execution.

    Replaces ephemeral daemon threads and blocking inline calls. The APScheduler
    worker polls for pending rows, marks them running, executes, and records the
    outcome. Failed jobs are retried up to max_attempts before being marked failed.
    """

    __tablename__ = "ai_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    task_type = Column(String(50), nullable=False)   # analyze_activity | analyze_feedback | generate_plan | weekly_review
    payload_json = Column(Text, nullable=True)        # JSON task args (e.g. {"activity_id": 123})
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending | running | done | failed
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow, index=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class ChatMessage(Base):
    """Persisted multi-turn chat messages between the athlete and the AI coach."""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    role = Column(String(20), nullable=False)   # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow, index=True)
    activity_id = Column(Integer, nullable=True)  # optional activity context


class TrainingPlanDay(Base):
    """One scheduled day within a TrainingPlan."""

    __tablename__ = "training_plan_days"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = _user_id_column()
    plan_id = Column(Integer, nullable=False, index=True)   # → TrainingPlan.id
    day_date = Column(Date, nullable=False, index=True)
    day_of_week = Column(Text, nullable=False)               # "Monday" … "Sunday"
    week_number = Column(Integer, nullable=False, default=1) # 1-based week within plan
    workout_type = Column(Text, nullable=False)              # easy, tempo, long, interval, rest, cross
    target_distance_m = Column(Float, nullable=True)
    target_pace_min_km = Column(Float, nullable=True)
    target_pace_display = Column(Text, nullable=True)        # "5:15/km"
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    week_theme = Column(Text, nullable=True)                 # e.g. "Aerobic Base"
