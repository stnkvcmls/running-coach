"""add season_plans and season_plan_weeks tables

Revision ID: m6n7o8p9q0r1
Revises: l5m6n7o8p9q0
Create Date: 2026-07-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "m6n7o8p9q0r1"
down_revision: Union[str, None] = "l5m6n7o8p9q0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    existing = insp.get_table_names()

    if "season_plans" not in existing:
        op.create_table(
            "season_plans",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("generated_at", sa.DateTime(), nullable=True),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("goal_race_title", sa.Text(), nullable=True),
            sa.Column("goal_race_date", sa.Date(), nullable=False),
            sa.Column("goal_race_distance_m", sa.Float(), nullable=True),
            sa.Column("goal_race_source", sa.Text(), nullable=True),
            sa.Column("peak_weekly_km", sa.Float(), nullable=True),
        )
        op.create_index("ix_season_plans_user_id", "season_plans", ["user_id"])
        op.create_index("ix_season_plans_generated_at", "season_plans", ["generated_at"])

    if "season_plan_weeks" not in existing:
        op.create_table(
            "season_plan_weeks",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("season_plan_id", sa.Integer(), nullable=False),
            sa.Column("week_number", sa.Integer(), nullable=False),
            sa.Column("week_start", sa.Date(), nullable=False),
            sa.Column("phase", sa.Text(), nullable=False),
            sa.Column("target_weekly_km", sa.Float(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
        )
        op.create_index("ix_season_plan_weeks_user_id", "season_plan_weeks", ["user_id"])
        op.create_index(
            "ix_season_plan_weeks_season_plan_id", "season_plan_weeks", ["season_plan_id"]
        )
        op.create_index("ix_season_plan_weeks_week_start", "season_plan_weeks", ["week_start"])


def downgrade() -> None:
    op.drop_index("ix_season_plan_weeks_week_start", "season_plan_weeks")
    op.drop_index("ix_season_plan_weeks_season_plan_id", "season_plan_weeks")
    op.drop_index("ix_season_plan_weeks_user_id", "season_plan_weeks")
    op.drop_table("season_plan_weeks")

    op.drop_index("ix_season_plans_generated_at", "season_plans")
    op.drop_index("ix_season_plans_user_id", "season_plans")
    op.drop_table("season_plans")
