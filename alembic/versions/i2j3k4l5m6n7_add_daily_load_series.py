"""add daily_load_series table for incremental CTL/ATL/TSB compute

Revision ID: i2j3k4l5m6n7
Revises: h1i2j3k4l5m6
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "i2j3k4l5m6n7"
down_revision: Union[str, None] = "h1i2j3k4l5m6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    if "daily_load_series" not in insp.get_table_names():
        op.create_table(
            "daily_load_series",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("date", sa.Date(), nullable=False),
            sa.Column("tss", sa.Float(), nullable=False, default=0.0),
            sa.Column("ctl", sa.Float(), nullable=False),
            sa.Column("atl", sa.Float(), nullable=False),
            sa.Column("tsb", sa.Float(), nullable=False),
            sa.Column("acwr", sa.Float(), nullable=True),
            sa.Column("ramp_rate_7d", sa.Float(), nullable=True),
            sa.Column("ramp_rate_28d", sa.Float(), nullable=True),
            sa.Column("injury_risk", sa.String(20), nullable=True),
            sa.Column("computed_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("user_id", "date", name="uq_daily_load_series_user_date"),
        )
        op.create_index("ix_daily_load_series_user_id", "daily_load_series", ["user_id"])
        op.create_index("ix_daily_load_series_date", "daily_load_series", ["date"])


def downgrade() -> None:
    op.drop_index("ix_daily_load_series_date", "daily_load_series")
    op.drop_index("ix_daily_load_series_user_id", "daily_load_series")
    op.drop_table("daily_load_series")
