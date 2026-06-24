"""add plan preference fields to athlete_profiles

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "athlete_profiles"

_COLUMNS = [
    ("training_volume", sa.Text(), True),
    ("difficulty", sa.Text(), True),
    ("running_ability", sa.Text(), True),
    ("elevation_profile", sa.Text(), True),
    ("weekly_mileage_km", sa.Float(), True),
    ("longest_run_km", sa.Float(), True),
    ("runs_per_week", sa.Integer(), True),
    ("available_days", sa.Text(), True),
    ("long_run_day", sa.Text(), True),
    ("race_times_json", sa.Text(), True),
]


def _has_column(insp: object, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def upgrade() -> None:
    insp = inspect(op.get_bind())
    with op.batch_alter_table(_TABLE) as batch_op:
        for col_name, col_type, nullable in _COLUMNS:
            if not _has_column(insp, _TABLE, col_name):
                batch_op.add_column(sa.Column(col_name, col_type, nullable=nullable))


def downgrade() -> None:
    with op.batch_alter_table(_TABLE) as batch_op:
        for col_name, _, _ in reversed(_COLUMNS):
            batch_op.drop_column(col_name)
