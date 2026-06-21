"""initial schema

Revision ID: e3a9b1c2d4f5
Revises:
Create Date: 2026-06-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e3a9b1c2d4f5"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("garmin_id", sa.BigInteger(), nullable=False),
        sa.Column("activity_type", sa.Text(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("duration_sec", sa.Float(), nullable=True),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("avg_hr", sa.Integer(), nullable=True),
        sa.Column("max_hr", sa.Integer(), nullable=True),
        sa.Column("avg_pace_min_km", sa.Float(), nullable=True),
        sa.Column("calories", sa.Float(), nullable=True),
        sa.Column("elevation_gain", sa.Float(), nullable=True),
        sa.Column("elevation_loss", sa.Float(), nullable=True),
        sa.Column("avg_cadence", sa.Float(), nullable=True),
        sa.Column("avg_stride", sa.Float(), nullable=True),
        sa.Column("training_effect_aerobic", sa.Float(), nullable=True),
        sa.Column("training_effect_anaerobic", sa.Float(), nullable=True),
        sa.Column("vo2max", sa.Float(), nullable=True),
        sa.Column("avg_power", sa.Float(), nullable=True),
        sa.Column("laps_json", sa.Text(), nullable=True),
        sa.Column("splits_json", sa.Text(), nullable=True),
        sa.Column("hr_zones_json", sa.Text(), nullable=True),
        sa.Column("weather_json", sa.Text(), nullable=True),
        sa.Column("raw_json", sa.Text(), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=True),
        sa.Column("ai_analyzed", sa.Boolean(), nullable=True),
        sa.Column("avg_ground_contact_time", sa.Float(), nullable=True),
        sa.Column("avg_vertical_oscillation", sa.Float(), nullable=True),
        sa.Column("avg_vertical_ratio", sa.Float(), nullable=True),
        sa.Column("normalized_power", sa.Float(), nullable=True),
        sa.Column("training_stress_score", sa.Float(), nullable=True),
        sa.Column("intensity_factor", sa.Float(), nullable=True),
        sa.Column("avg_respiration_rate", sa.Float(), nullable=True),
        sa.Column("max_respiration_rate", sa.Float(), nullable=True),
        sa.Column("avg_speed", sa.Float(), nullable=True),
        sa.Column("max_speed", sa.Float(), nullable=True),
        sa.Column("min_hr", sa.Integer(), nullable=True),
        sa.Column("max_elevation", sa.Float(), nullable=True),
        sa.Column("min_elevation", sa.Float(), nullable=True),
        sa.Column("max_cadence", sa.Float(), nullable=True),
        sa.Column("run_time_sec", sa.Float(), nullable=True),
        sa.Column("walk_time_sec", sa.Float(), nullable=True),
        sa.Column("typed_splits_json", sa.Text(), nullable=True),
        sa.Column("power_zones_json", sa.Text(), nullable=True),
        sa.Column("mean_max_json", sa.Text(), nullable=True),
        sa.Column("feedback_rating", sa.String(10), nullable=True),
        sa.Column("feedback_tags", sa.Text(), nullable=True),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garmin_id"),
    )
    op.create_index("ix_activities_garmin_id", "activities", ["garmin_id"], unique=True)
    op.create_index("ix_activities_started_at", "activities", ["started_at"], unique=False)

    op.create_table(
        "daily_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("steps", sa.Integer(), nullable=True),
        sa.Column("total_calories", sa.Integer(), nullable=True),
        sa.Column("active_calories", sa.Integer(), nullable=True),
        sa.Column("resting_hr", sa.Integer(), nullable=True),
        sa.Column("max_hr", sa.Integer(), nullable=True),
        sa.Column("stress_avg", sa.Integer(), nullable=True),
        sa.Column("sleep_seconds", sa.Integer(), nullable=True),
        sa.Column("sleep_score", sa.Float(), nullable=True),
        sa.Column("body_battery_high", sa.Integer(), nullable=True),
        sa.Column("body_battery_low", sa.Integer(), nullable=True),
        sa.Column("intensity_minutes", sa.Integer(), nullable=True),
        sa.Column("floors_climbed", sa.Integer(), nullable=True),
        sa.Column("hrv_avg", sa.Float(), nullable=True),
        sa.Column("hrv_weekly_avg", sa.Float(), nullable=True),
        sa.Column("hrv_status", sa.String(20), nullable=True),
        sa.Column("raw_json", sa.Text(), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=True),
        sa.Column("ai_analyzed", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("date"),
    )
    op.create_index("ix_daily_summaries_date", "daily_summaries", ["date"], unique=True)

    op.create_table(
        "insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("trigger_type", sa.Text(), nullable=True),
        sa.Column("trigger_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("category", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_insights_created_at", "insights", ["created_at"], unique=False)

    op.create_table(
        "races",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("distance_label", sa.Text(), nullable=True),
        sa.Column("goal_time_sec", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_races_date", "races", ["date"], unique=False)

    op.create_table(
        "garmin_calendar_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("garmin_id", sa.String(100), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("distance_label", sa.Text(), nullable=True),
        sa.Column("goal_time_sec", sa.Integer(), nullable=True),
        sa.Column("priority", sa.String(1), nullable=True),
        sa.Column("workout_type", sa.Text(), nullable=True),
        sa.Column("workout_description", sa.Text(), nullable=True),
        sa.Column("raw_json", sa.Text(), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garmin_id"),
    )
    op.create_index(
        "ix_garmin_calendar_events_garmin_id", "garmin_calendar_events", ["garmin_id"], unique=True
    )
    op.create_index(
        "ix_garmin_calendar_events_event_type", "garmin_calendar_events", ["event_type"], unique=False
    )
    op.create_index(
        "ix_garmin_calendar_events_date", "garmin_calendar_events", ["date"], unique=False
    )

    op.create_table(
        "metric_zones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("metric_key", sa.String(50), nullable=False),
        sa.Column("zone_name", sa.String(20), nullable=False),
        sa.Column("zone_color", sa.String(20), nullable=False),
        sa.Column("percentile_label", sa.String(20), nullable=False),
        sa.Column("min_value", sa.Float(), nullable=True),
        sa.Column("max_value", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metric_zones_metric_key", "metric_zones", ["metric_key"], unique=False)

    op.create_table(
        "sync_status",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "athlete_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("goal_race", sa.Text(), nullable=True),
        sa.Column("goal_race_date", sa.Date(), nullable=True),
        sa.Column("threshold_pace_min_km", sa.Float(), nullable=True),
        sa.Column("threshold_hr", sa.Integer(), nullable=True),
        sa.Column("threshold_power", sa.Integer(), nullable=True),
        sa.Column("max_hr", sa.Integer(), nullable=True),
        sa.Column("resting_hr", sa.Integer(), nullable=True),
        sa.Column("injury_history", sa.Text(), nullable=True),
        sa.Column("weekly_availability", sa.Text(), nullable=True),
        sa.Column("training_preferences", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "zone_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("zone_type", sa.String(20), nullable=False),
        sa.Column("zone_number", sa.Integer(), nullable=False),
        sa.Column("zone_name", sa.String(50), nullable=False),
        sa.Column("zone_color", sa.String(20), nullable=False),
        sa.Column("min_pct", sa.Float(), nullable=True),
        sa.Column("max_pct", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("zone_type", "zone_number", name="uq_zone_type_number"),
    )
    op.create_index("ix_zone_configs_zone_type", "zone_configs", ["zone_type"], unique=False)

    op.create_table(
        "training_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=True),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("plan_weeks", sa.Integer(), nullable=True),
        sa.Column("phase", sa.Text(), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("raw_json", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_training_plans_generated_at", "training_plans", ["generated_at"], unique=False)

    op.create_table(
        "training_plan_days",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("day_date", sa.Date(), nullable=False),
        sa.Column("day_of_week", sa.Text(), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("workout_type", sa.Text(), nullable=False),
        sa.Column("target_distance_m", sa.Float(), nullable=True),
        sa.Column("target_pace_min_km", sa.Float(), nullable=True),
        sa.Column("target_pace_display", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("week_theme", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_training_plan_days_plan_id", "training_plan_days", ["plan_id"], unique=False)
    op.create_index("ix_training_plan_days_day_date", "training_plan_days", ["day_date"], unique=False)


def downgrade() -> None:
    op.drop_table("training_plan_days")
    op.drop_table("training_plans")
    op.drop_table("zone_configs")
    op.drop_table("athlete_profiles")
    op.drop_table("sync_status")
    op.drop_table("metric_zones")
    op.drop_table("garmin_calendar_events")
    op.drop_table("races")
    op.drop_table("insights")
    op.drop_table("daily_summaries")
    op.drop_table("activities")
    op.drop_table("users")
