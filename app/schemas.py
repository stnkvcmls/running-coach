from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, field_validator


class ActivitySummary(BaseModel):
    id: int
    garmin_id: int | None = None
    activity_type: str | None = None
    name: str | None = None
    started_at: datetime | None = None
    duration_sec: float | None = None
    distance_m: float | None = None
    avg_hr: int | None = None
    max_hr: int | None = None
    avg_pace_min_km: float | None = None
    calories: float | None = None
    elevation_gain: float | None = None

    class Config:
        from_attributes = True


class InsightResponse(BaseModel):
    id: int
    created_at: datetime | None = None
    trigger_type: str | None = None
    trigger_id: int | None = None
    content: str | None = None
    summary: str | None = None
    category: str | None = None

    class Config:
        from_attributes = True


class MetricZoneResponse(BaseModel):
    metric_key: str
    zone_name: str
    zone_color: str
    percentile_label: str
    min_value: float | None = None
    max_value: float | None = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    email: str
    full_name: str | None = None

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    rating: Literal["good", "bad"]
    tags: list[str] | None = None
    text: str | None = None


class GarminCredentialsRequest(BaseModel):
    email: str
    password: str


class GarminMfaRequest(BaseModel):
    code: str


class GarminConnectResult(BaseModel):
    # "connected" once tokens are stored, "mfa_required" when a code is needed.
    status: Literal["connected", "mfa_required"]


class GarminConnectionStatus(BaseModel):
    connected: bool
    garmin_email: str | None = None
    mfa_pending: bool = False


class IntervalAdherence(BaseModel):
    step_order: int
    label: str                                   # "Warmup", "Interval 1", "Recovery 2", "Cooldown"
    step_type: str                               # warmup, interval, rest, cooldown, …
    planned_distance_m: float | None = None
    actual_distance_m: float | None = None
    planned_pace_display: str | None = None
    actual_pace_display: str | None = None
    pace_delta_sec_per_km: float | None = None   # positive = slower than plan
    distance_delta_m: float | None = None        # actual - planned
    matched: bool = True                          # a lap aligned to this step


class WorkoutAdherence(BaseModel):
    planned_distance_m: float | None = None    # running periods only (rest excluded)
    planned_rest_distance_m: float | None = None
    actual_distance_m: float | None = None     # running distance (rest excluded)
    actual_rest_distance_m: float | None = None  # distance covered during rest laps
    distance_pct: float | None = None          # actual / planned × 100, capped at 100
    planned_pace_display: str | None = None    # e.g. "4:30/km"
    actual_pace_display: str | None = None     # e.g. "4:38/km"
    pace_delta_sec_per_km: float | None = None # positive = slower than planned
    planned_intervals: int | None = None
    actual_laps: int | None = None
    adherence_score: float                     # 0–100 composite
    summary: str                               # human-readable verdict
    intervals: list[IntervalAdherence] | None = None  # per-rep lap↔step alignment


class ActivityDetail(BaseModel):
    id: int
    garmin_id: int | None = None
    activity_type: str | None = None
    name: str | None = None
    started_at: datetime | None = None
    duration_sec: float | None = None
    distance_m: float | None = None
    avg_hr: int | None = None
    max_hr: int | None = None
    min_hr: int | None = None
    avg_pace_min_km: float | None = None
    calories: float | None = None
    elevation_gain: float | None = None
    elevation_loss: float | None = None
    max_elevation: float | None = None
    min_elevation: float | None = None
    avg_cadence: float | None = None
    max_cadence: float | None = None
    avg_stride: float | None = None
    training_effect_aerobic: float | None = None
    training_effect_anaerobic: float | None = None
    vo2max: float | None = None
    avg_power: float | None = None
    normalized_power: float | None = None
    training_stress_score: float | None = None
    intensity_factor: float | None = None
    avg_ground_contact_time: float | None = None
    avg_vertical_oscillation: float | None = None
    avg_vertical_ratio: float | None = None
    avg_speed: float | None = None
    max_speed: float | None = None
    avg_respiration_rate: float | None = None
    max_respiration_rate: float | None = None
    run_time_sec: float | None = None
    walk_time_sec: float | None = None

    # Parsed JSON fields
    splits: Any | None = None
    hr_zones: Any | None = None
    weather: Any | None = None
    power_zones: Any | None = None
    chart_data: dict | None = None

    # Metric zone boundaries
    metric_zones: dict[str, list[MetricZoneResponse]] | None = None

    # User feedback
    feedback_rating: str | None = None
    feedback_tags: list[str] | None = None
    feedback_text: str | None = None

    # Related insight
    insight: InsightResponse | None = None

    # Scheduled workout for this activity's date
    scheduled_workout: "CalendarEventResponse | None" = None

    # Workout adherence comparison (planned vs actual)
    adherence: "WorkoutAdherence | None" = None

    @field_validator('feedback_tags', mode='before')
    @classmethod
    def parse_feedback_tags(cls, v: Any) -> list[str] | None:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True


class DailySummaryResponse(BaseModel):
    id: int
    date: date
    steps: int | None = None
    total_calories: int | None = None
    active_calories: int | None = None
    resting_hr: int | None = None
    max_hr: int | None = None
    stress_avg: int | None = None
    sleep_seconds: int | None = None
    sleep_score: float | None = None
    body_battery_high: int | None = None
    body_battery_low: int | None = None
    intensity_minutes: int | None = None
    floors_climbed: float | None = None
    hrv_avg: float | None = None
    hrv_weekly_avg: float | None = None
    hrv_status: str | None = None

    class Config:
        from_attributes = True


class DailySummaryDetail(BaseModel):
    summary: DailySummaryResponse
    activities: list[ActivitySummary] = []
    insight: InsightResponse | None = None


class WorkoutStepResponse(BaseModel):
    step_order: int
    step_type: str  # warmup, cooldown, interval, rest, repeat, recovery
    end_condition: str | None = None  # distance, time, lap_button
    end_condition_value: float | None = None
    end_condition_display: str | None = None  # "2.4 km", "90s"
    target_type: str | None = None  # pace, heart_rate, open
    target_display: str | None = None  # "4:25/km", "conversational pace"
    description: str | None = None  # extra note
    activity_type: str | None = None  # run, rest
    repeat_count: int | None = None
    steps: list["WorkoutStepResponse"] | None = None


class CalendarEventResponse(BaseModel):
    id: int
    event_type: str | None = None
    date: date
    title: str | None = None
    distance_m: float | None = None
    distance_label: str | None = None
    goal_time_sec: int | None = None
    priority: str | None = None
    workout_type: str | None = None
    workout_description: str | None = None
    workout_steps: list[WorkoutStepResponse] | None = None

    class Config:
        from_attributes = True


class CalendarDay(BaseModel):
    date: date
    activities: list[ActivitySummary] = []
    events: list[CalendarEventResponse] = []


class WeeklyMileage(BaseModel):
    label: str
    km: float
    by_type: dict[str, float] = {}  # activity category -> km


class RaceInfo(BaseModel):
    id: int
    title: str | None = None
    date: date
    distance_label: str | None = None
    days_away: int
    goal_time_sec: int | None = None
    priority: str | None = None


class TrainingLoadPoint(BaseModel):
    date: date
    tss: float
    ctl: float  # Chronic Training Load — "Fitness" (42-day EWMA)
    atl: float  # Acute Training Load — "Fatigue" (7-day EWMA)
    tsb: float  # Training Stress Balance — "Form" (CTL − ATL)
    acwr: float | None = None          # Acute:Chronic Workload Ratio (ATL/CTL)
    ramp_rate_7d: float | None = None  # CTL change over last 7 days
    ramp_rate_28d: float | None = None # CTL change over last 28 days
    injury_risk: str | None = None     # "low" | "moderate" | "high"


class TrainingReadiness(BaseModel):
    score: int           # 0-100 composite readiness
    label: str           # "Low", "Fair", "Good", "Very Good", "Excellent"
    sleep_component: int | None = None      # 0-100, from sleep duration + quality
    recovery_component: int | None = None   # 0-100, from stress + body battery
    fatigue_component: int | None = None    # 0-100, ATL-based (higher = less fatigued)
    rhr_component: int | None = None        # 0-100, resting HR trend vs 7d avg
    hrv_component: int | None = None        # 0-100, overnight HRV vs personal baseline


class TrainingLoadResponse(BaseModel):
    points: list[TrainingLoadPoint] = []
    current: TrainingLoadPoint | None = None


class TodayResponse(BaseModel):
    selected_date: date
    activities: list[ActivitySummary] = []
    daily_summary: DailySummaryResponse | None = None
    weekly_data: list[WeeklyMileage] = []
    insights: list[InsightResponse] = []
    next_races: list[RaceInfo] = []
    scheduled_events: list[CalendarEventResponse] = []
    training_load: TrainingLoadPoint | None = None
    readiness: TrainingReadiness | None = None


class SettingsResponse(BaseModel):
    sync_statuses: dict[str, Any] = {}
    counts: dict[str, int] = {}


class AiConfigResponse(BaseModel):
    provider: str
    model: str
    available_providers: list[str]
    available_models: dict[str, list[str]]


class AiConfigRequest(BaseModel):
    provider: str
    model: str


class AthleteProfileRequest(BaseModel):
    name: str | None = None
    date_of_birth: date | None = None
    weight_kg: float | None = None
    goal_race: str | None = None
    goal_race_date: date | None = None
    threshold_pace_min_km: float | None = None
    threshold_hr: int | None = None
    threshold_power: int | None = None
    max_hr: int | None = None
    resting_hr: int | None = None
    injury_history: str | None = None
    weekly_availability: str | None = None
    training_preferences: str | None = None


class AthleteProfileResponse(BaseModel):
    id: int
    name: str | None = None
    date_of_birth: date | None = None
    age: int | None = None
    weight_kg: float | None = None
    goal_race: str | None = None
    goal_race_date: date | None = None
    threshold_pace_min_km: float | None = None
    threshold_hr: int | None = None
    threshold_power: int | None = None
    max_hr: int | None = None
    resting_hr: int | None = None
    injury_history: str | None = None
    weekly_availability: str | None = None
    training_preferences: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class ZoneConfigResponse(BaseModel):
    id: int
    zone_type: str
    zone_number: int
    zone_name: str
    zone_color: str
    min_pct: float | None = None
    max_pct: float | None = None
    computed_min: float | None = None  # absolute value in native units (bpm, min/km, W)
    computed_max: float | None = None

    class Config:
        from_attributes = True


class ZoneConfigUpdate(BaseModel):
    zone_type: str
    zone_number: int
    zone_name: str | None = None
    zone_color: str | None = None
    min_pct: float | None = None
    max_pct: float | None = None


class ZoneConfigBulkUpdate(BaseModel):
    zones: list[ZoneConfigUpdate]


class ZoneConfigsResponse(BaseModel):
    hr: list[ZoneConfigResponse] = []
    pace: list[ZoneConfigResponse] = []
    power: list[ZoneConfigResponse] = []
    threshold_hr: int | None = None
    threshold_pace_min_km: float | None = None
    threshold_power: int | None = None


class ThresholdEstimateField(BaseModel):
    value: float | None = None
    method: str | None = None          # e.g. "critical_power_2p", "critical_velocity"
    confidence: str | None = None      # "low" | "medium" | "high"
    sample_size: int = 0
    note: str | None = None            # guidance when the fit is poorly constrained


class ThresholdEstimateResponse(BaseModel):
    critical_power: ThresholdEstimateField          # W (≈ running FTP)
    w_prime: float | None = None                    # J (anaerobic work capacity)
    pmax: float | None = None                       # W (3-param model max power)
    threshold_pace_min_km: ThresholdEstimateField
    threshold_hr: ThresholdEstimateField            # LTHR, bpm
    max_hr: ThresholdEstimateField                  # bpm
    lookback_days: int
    activities_analyzed: int

    # Current profile values, for side-by-side comparison in the UI.
    current_threshold_power: int | None = None
    current_threshold_pace_min_km: float | None = None
    current_threshold_hr: int | None = None
    current_max_hr: int | None = None


class ThresholdApplyRequest(BaseModel):
    # Which estimated fields to write to the profile. Omit/empty → apply all
    # available estimates.
    fields: list[str] | None = None


class PerformanceCurvePoint(BaseModel):
    duration_sec: int
    actual_value: float        # frontier best (power W or speed m/s)
    model_value: float | None  # model fit at this duration


class RacePrediction(BaseModel):
    distance_label: str          # "5K", "10K", "Half Marathon", "Marathon"
    distance_m: float
    predicted_time_sec: float    # from CV model
    predicted_pace_min_km: float


class PerformanceCurveResponse(BaseModel):
    power_points: list[PerformanceCurvePoint] = []
    pace_points: list[PerformanceCurvePoint] = []
    critical_power: float | None = None   # W
    w_prime: float | None = None          # J
    critical_velocity: float | None = None  # m/s
    d_prime: float | None = None            # m
    race_predictions: list[RacePrediction] = []
    lookback_days: int
    activities_analyzed: int


class TrainingPlanDayResponse(BaseModel):
    id: int
    plan_id: int
    day_date: date
    day_of_week: str
    week_number: int
    workout_type: str
    target_distance_m: float | None = None
    target_pace_min_km: float | None = None
    target_pace_display: str | None = None
    description: str | None = None
    notes: str | None = None
    week_theme: str | None = None

    class Config:
        from_attributes = True


class TrainingPlanWeek(BaseModel):
    week_number: int
    week_start: date
    week_end: date
    theme: str | None = None
    days: list[TrainingPlanDayResponse] = []


class TrainingPlanResponse(BaseModel):
    id: int
    generated_at: datetime
    week_start: date
    plan_weeks: int
    phase: str | None = None
    overview: str | None = None
    weeks: list[TrainingPlanWeek] = []

    class Config:
        from_attributes = True


class MissedPlanSession(BaseModel):
    date: date
    workout_type: str
    target_distance_km: float | None = None


class PlanRealignmentStatus(BaseModel):
    should_prompt: bool
    missed_count: int
    total_scheduled: int
    missed_sessions: list[MissedPlanSession] = []


class PlanRealignmentRequest(BaseModel):
    action: Literal["regenerate", "dismiss"]


class IntensityWeek(BaseModel):
    week_start: date
    zone_seconds: dict[str, float]
    total_seconds: float
    easy_pct: float | None = None
    moderate_pct: float | None = None
    hard_pct: float | None = None


class IntensityTrendsResponse(BaseModel):
    weeks: list[IntensityWeek] = []
    zone_type: str
    days: int
