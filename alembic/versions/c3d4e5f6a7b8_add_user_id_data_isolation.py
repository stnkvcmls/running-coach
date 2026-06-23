"""add user_id to all data tables (multi-user data isolation)

Phase 3 of the multi-user plan: every data row is keyed on a user. Existing
rows are backfilled to the primary/bootstrap user (id=1) via a server_default,
and single-tenant uniqueness (date, garmin_id, sync key, …) becomes per-user.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Data tables that gain a ``user_id`` scoping column. ``metric_zones`` is global
# reference data and is intentionally excluded.
_USER_SCOPED_TABLES = [
    "activities",
    "daily_summaries",
    "insights",
    "races",
    "garmin_calendar_events",
    "athlete_profiles",
    "zone_configs",
    "training_plans",
    "training_plan_days",
    "sync_status",
]


# Naming convention so batch mode can target the unnamed UNIQUE constraints the
# initial schema declared (e.g. ``UniqueConstraint("date")`` → "uq_<table>_<col>").
_NAMING = {"uq": "uq_%(table_name)s_%(column_0_name)s"}


def upgrade() -> None:
    # users.garmin_needs_reauth — set when a cron sync can't re-auth a user.
    op.add_column(
        "users",
        sa.Column(
            "garmin_needs_reauth",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    # Add user_id to every data table; server_default="1" backfills all existing
    # rows to the primary user so nothing is orphaned.
    for table in _USER_SCOPED_TABLES:
        op.add_column(
            table,
            sa.Column("user_id", sa.Integer(), nullable=False, server_default="1"),
        )
        op.create_index(f"ix_{table}_user_id", table, ["user_id"])

    # --- Rework single-tenant uniqueness into per-user uniqueness -----------
    # The initial schema put BOTH a unique index and an unnamed UNIQUE table
    # constraint on these single columns, so each must be reworked: demote the
    # index to a plain lookup index and replace the constraint with a composite.

    # activities.garmin_id → unique per (user_id, garmin_id).
    op.drop_index("ix_activities_garmin_id", table_name="activities")
    op.create_index("ix_activities_garmin_id", "activities", ["garmin_id"])
    with op.batch_alter_table("activities", naming_convention=_NAMING) as batch_op:
        batch_op.drop_constraint("uq_activities_garmin_id", type_="unique")
        batch_op.create_unique_constraint(
            "uq_activities_user_garmin", ["user_id", "garmin_id"]
        )

    # daily_summaries.date → unique per (user_id, date).
    op.drop_index("ix_daily_summaries_date", table_name="daily_summaries")
    op.create_index("ix_daily_summaries_date", "daily_summaries", ["date"])
    with op.batch_alter_table("daily_summaries", naming_convention=_NAMING) as batch_op:
        batch_op.drop_constraint("uq_daily_summaries_date", type_="unique")
        batch_op.create_unique_constraint(
            "uq_daily_summaries_user_date", ["user_id", "date"]
        )

    # garmin_calendar_events.garmin_id → unique per (user_id, garmin_id).
    op.drop_index(
        "ix_garmin_calendar_events_garmin_id", table_name="garmin_calendar_events"
    )
    op.create_index(
        "ix_garmin_calendar_events_garmin_id", "garmin_calendar_events", ["garmin_id"]
    )
    with op.batch_alter_table(
        "garmin_calendar_events", naming_convention=_NAMING
    ) as batch_op:
        batch_op.drop_constraint(
            "uq_garmin_calendar_events_garmin_id", type_="unique"
        )
        batch_op.create_unique_constraint(
            "uq_garmin_calendar_user_garmin", ["user_id", "garmin_id"]
        )

    # athlete_profiles: one profile per user (no prior uniqueness existed).
    op.create_index(
        "uq_athlete_profiles_user", "athlete_profiles", ["user_id"], unique=True
    )

    # zone_configs: the named (zone_type, zone_number) unique becomes per-user.
    with op.batch_alter_table("zone_configs") as batch_op:
        batch_op.drop_constraint("uq_zone_type_number", type_="unique")
        batch_op.create_unique_constraint(
            "uq_zone_type_number", ["user_id", "zone_type", "zone_number"]
        )

    # sync_status: the global unique on ``key`` becomes per-user.
    with op.batch_alter_table("sync_status", naming_convention=_NAMING) as batch_op:
        batch_op.drop_constraint("uq_sync_status_key", type_="unique")
        batch_op.create_unique_constraint("uq_sync_status_user_key", ["user_id", "key"])


def downgrade() -> None:
    with op.batch_alter_table("sync_status") as batch_op:
        batch_op.drop_constraint("uq_sync_status_user_key", type_="unique")
        batch_op.create_unique_constraint("uq_sync_status_key", ["key"])

    with op.batch_alter_table("zone_configs") as batch_op:
        batch_op.drop_constraint("uq_zone_type_number", type_="unique")
        batch_op.create_unique_constraint("uq_zone_type_number", ["zone_type", "zone_number"])

    op.drop_index("uq_athlete_profiles_user", table_name="athlete_profiles")

    with op.batch_alter_table("garmin_calendar_events") as batch_op:
        batch_op.drop_constraint("uq_garmin_calendar_user_garmin", type_="unique")
        batch_op.create_unique_constraint("uq_garmin_calendar_events_garmin_id", ["garmin_id"])

    with op.batch_alter_table("daily_summaries") as batch_op:
        batch_op.drop_constraint("uq_daily_summaries_user_date", type_="unique")
        batch_op.create_unique_constraint("uq_daily_summaries_date", ["date"])

    with op.batch_alter_table("activities") as batch_op:
        batch_op.drop_constraint("uq_activities_user_garmin", type_="unique")
        batch_op.create_unique_constraint("uq_activities_garmin_id", ["garmin_id"])

    for table in _USER_SCOPED_TABLES:
        op.drop_index(f"ix_{table}_user_id", table_name=table)
        op.drop_column(table, "user_id")

    op.drop_column("users", "garmin_needs_reauth")
