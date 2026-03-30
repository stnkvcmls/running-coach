from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel


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


class FeedbackRequest(BaseModel):
    rating: Literal["good", "bad"]
    tags: list[str] | None = None
    text: str | None = None


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


class RaceInfo(BaseModel):
    id: int
    title: str | None = None
    date: date
    distance_label: str | None = None
    days_away: int


class TodayResponse(BaseModel):
    selected_date: date
    activities: list[ActivitySummary] = []
    daily_summary: DailySummaryResponse | None = None
    weekly_data: list[WeeklyMileage] = []
    insights: list[InsightResponse] = []
    next_race: RaceInfo | None = None
    scheduled_events: list[CalendarEventResponse] = []


class SettingsResponse(BaseModel):
    sync_statuses: dict[str, Any] = {}
    counts: dict[str, int] = {}
