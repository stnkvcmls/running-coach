"""add routine_id to training_plan_days

Revision ID: j3k4l5m6n7o8
Revises: f6a7b8c9d0e1
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "j3k4l5m6n7o8"
down_revision: Union[str, None] = "i2j3k4l5m6n7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("training_plan_days")}
    if "routine_id" not in cols:
        op.add_column("training_plan_days", sa.Column("routine_id", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("training_plan_days", "routine_id")
