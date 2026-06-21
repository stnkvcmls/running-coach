"""add garmin race predictions to calendar events

Revision ID: a1b2c3d4e5f6
Revises: e3a9b1c2d4f5
Create Date: 2026-06-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e3a9b1c2d4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("garmin_calendar_events") as batch_op:
        batch_op.add_column(sa.Column("projected_race_time_sec", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("predicted_race_time_sec", sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("garmin_calendar_events") as batch_op:
        batch_op.drop_column("predicted_race_time_sec")
        batch_op.drop_column("projected_race_time_sec")
