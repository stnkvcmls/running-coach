"""add user_id to all data tables (multi-user data isolation)

Phase 3 of the multi-user plan: every data row is keyed on a user. Existing
rows are backfilled to the primary/bootstrap user (id=1) via a server_default,
and single-tenant uniqueness (date, garmin_id, sync key, …) becomes per-user.

This migration is written to be **idempotent and topology-agnostic**: it
inspects the live schema and only applies the steps still missing. That matters
because a DB may have reached the previous head two different ways — through the
Alembic migrations (which declared *both* a unique index and an unnamed UNIQUE
table constraint on columns like ``garmin_id``/``date``) or through an older
``Base.metadata.create_all`` that was later ``stamp``ed (which produced only a
unique *index* for ``unique=True, index=True`` columns and no table constraint).
SQLite runs DDL non-transactionally, so a partially-applied earlier attempt must
also be safely resumable.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

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

# Names the reflected unnamed UNIQUE constraints so batch mode can drop them.
_NAMING = {"uq": "uq_%(table_name)s_%(column_0_name)s"}


# --- introspection helpers --------------------------------------------------

def _has_column(insp, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def _index_names(insp, table: str) -> set:
    return {ix["name"] for ix in insp.get_indexes(table)}


def _unique_indexes_on(insp, table: str, cols: list) -> list:
    return [
        ix["name"]
        for ix in insp.get_indexes(table)
        if ix.get("unique") and list(ix.get("column_names") or []) == cols
    ]


def _unique_constraints_on(insp, table: str, cols: list) -> list:
    return [
        uc
        for uc in insp.get_unique_constraints(table)
        if list(uc.get("column_names") or []) == cols
    ]


def _has_composite_unique(insp, table: str, cols: list) -> bool:
    """True if ``cols`` are already enforced unique (as an index or constraint)."""
    if _unique_indexes_on(insp, table, cols):
        return True
    return bool(_unique_constraints_on(insp, table, cols))


# --- uniqueness rework ------------------------------------------------------

def _rework_single_col_unique(
    table: str, col: str, composite_name: str, lookup_index: str
) -> None:
    """Replace per-table uniqueness on ``col`` with ``(user_id, col)``.

    Handles both schema topologies and is a no-op once already applied.
    """
    insp = inspect(op.get_bind())
    if _has_composite_unique(insp, table, ["user_id", col]):
        return  # already reworked

    # Demote any unique index on the single column to a plain lookup index.
    for ix_name in _unique_indexes_on(insp, table, [col]):
        op.drop_index(ix_name, table_name=table)
    insp = inspect(op.get_bind())
    if lookup_index not in _index_names(insp, table):
        op.create_index(lookup_index, table, [col])

    # Drop any table-level UNIQUE constraint on the single column (the
    # migration-built topology), then add the composite. When none exists (the
    # create_all topology), enforce the composite with a unique index instead.
    constraints = _unique_constraints_on(insp, table, [col])
    if constraints:
        with op.batch_alter_table(table, naming_convention=_NAMING) as batch_op:
            for uc in constraints:
                batch_op.drop_constraint(uc.get("name") or f"uq_{table}_{col}", type_="unique")
            batch_op.create_unique_constraint(composite_name, ["user_id", col])
    else:
        op.create_index(composite_name, table, ["user_id", col], unique=True)


def _replace_table_unique(
    table: str, old_cols: list, new_name: str, new_cols: list
) -> None:
    """Replace a table-level UNIQUE on ``old_cols`` with one on ``new_cols``."""
    insp = inspect(op.get_bind())
    if _has_composite_unique(insp, table, new_cols):
        return
    constraints = _unique_constraints_on(insp, table, old_cols)
    with op.batch_alter_table(table, naming_convention=_NAMING) as batch_op:
        for uc in constraints:
            batch_op.drop_constraint(
                uc.get("name") or f"uq_{table}_{old_cols[0]}", type_="unique"
            )
        batch_op.create_unique_constraint(new_name, new_cols)


def upgrade() -> None:
    insp = inspect(op.get_bind())

    # users.garmin_needs_reauth — set when a cron sync can't re-auth a user.
    if not _has_column(insp, "users", "garmin_needs_reauth"):
        op.add_column(
            "users",
            sa.Column(
                "garmin_needs_reauth",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    # Add user_id to every data table; server_default="1" backfills existing
    # rows to the primary user so nothing is orphaned.
    for table in _USER_SCOPED_TABLES:
        insp = inspect(op.get_bind())
        if not _has_column(insp, table, "user_id"):
            op.add_column(
                table,
                sa.Column("user_id", sa.Integer(), nullable=False, server_default="1"),
            )
        if f"ix_{table}_user_id" not in _index_names(inspect(op.get_bind()), table):
            op.create_index(f"ix_{table}_user_id", table, ["user_id"])

    # Rework single-tenant uniqueness into per-user uniqueness.
    _rework_single_col_unique(
        "activities", "garmin_id", "uq_activities_user_garmin", "ix_activities_garmin_id"
    )
    _rework_single_col_unique(
        "daily_summaries", "date", "uq_daily_summaries_user_date", "ix_daily_summaries_date"
    )
    _rework_single_col_unique(
        "garmin_calendar_events", "garmin_id",
        "uq_garmin_calendar_user_garmin", "ix_garmin_calendar_events_garmin_id",
    )

    # athlete_profiles: one profile per user.
    if "uq_athlete_profiles_user" not in _index_names(inspect(op.get_bind()), "athlete_profiles"):
        if not _has_composite_unique(inspect(op.get_bind()), "athlete_profiles", ["user_id"]):
            op.create_index(
                "uq_athlete_profiles_user", "athlete_profiles", ["user_id"], unique=True
            )

    # zone_configs + sync_status: replace the table-level unique with a per-user one.
    _replace_table_unique(
        "zone_configs", ["zone_type", "zone_number"],
        "uq_zone_type_number", ["user_id", "zone_type", "zone_number"],
    )
    _replace_table_unique(
        "sync_status", ["key"], "uq_sync_status_user_key", ["user_id", "key"]
    )


def downgrade() -> None:
    # Best-effort reverse: collapse the per-user uniques back to single-tenant.
    # Only meaningful for genuinely single-user data.
    _replace_table_unique_back("sync_status", ["user_id", "key"], "uq_sync_status_key", ["key"])
    _replace_table_unique_back(
        "zone_configs", ["user_id", "zone_type", "zone_number"],
        "uq_zone_type_number", ["zone_type", "zone_number"],
    )

    insp = inspect(op.get_bind())
    if "uq_athlete_profiles_user" in _index_names(insp, "athlete_profiles"):
        op.drop_index("uq_athlete_profiles_user", table_name="athlete_profiles")

    _restore_single_col_unique("garmin_calendar_events", "garmin_id", "uq_garmin_calendar_user_garmin")
    _restore_single_col_unique("daily_summaries", "date", "uq_daily_summaries_user_date")
    _restore_single_col_unique("activities", "garmin_id", "uq_activities_user_garmin")

    for table in _USER_SCOPED_TABLES:
        insp = inspect(op.get_bind())
        if f"ix_{table}_user_id" in _index_names(insp, table):
            op.drop_index(f"ix_{table}_user_id", table_name=table)
        if _has_column(insp, table, "user_id"):
            op.drop_column(table, "user_id")

    insp = inspect(op.get_bind())
    if _has_column(insp, "users", "garmin_needs_reauth"):
        op.drop_column("users", "garmin_needs_reauth")


def _replace_table_unique_back(table, old_cols, new_name, new_cols) -> None:
    insp = inspect(op.get_bind())
    if not _has_composite_unique(insp, table, old_cols):
        return
    with op.batch_alter_table(table, naming_convention=_NAMING) as batch_op:
        for uc in _unique_constraints_on(insp, table, old_cols):
            batch_op.drop_constraint(uc.get("name"), type_="unique")
        batch_op.create_unique_constraint(new_name, new_cols)


def _restore_single_col_unique(table, col, composite_name) -> None:
    insp = inspect(op.get_bind())
    # Drop composite (index or constraint form), restore single-col unique index.
    for ix_name in _unique_indexes_on(insp, table, ["user_id", col]):
        op.drop_index(ix_name, table_name=table)
    insp = inspect(op.get_bind())
    if _unique_constraints_on(insp, table, ["user_id", col]):
        with op.batch_alter_table(table, naming_convention=_NAMING) as batch_op:
            for uc in _unique_constraints_on(insp, table, ["user_id", col]):
                batch_op.drop_constraint(uc.get("name") or composite_name, type_="unique")
    insp = inspect(op.get_bind())
    if not _has_composite_unique(insp, table, [col]):
        # mirror the lookup index back to unique
        for ix in inspect(op.get_bind()).get_indexes(table):
            if list(ix.get("column_names") or []) == [col]:
                op.drop_index(ix["name"], table_name=table)
        op.create_index(f"ix_{table}_{col}", table, [col], unique=True)
