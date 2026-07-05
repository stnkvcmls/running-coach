"""add activity rpe and daily_checkins table

Revision ID: p9q0r1s2t3u4
Revises: o8p9q0r1s2t3
Create Date: 2026-07-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "p9q0r1s2t3u4"
down_revision: Union[str, None] = "o8p9q0r1s2t3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "activities"


def _has_column(insp: object, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def upgrade() -> None:
    insp = inspect(op.get_bind())

    with op.batch_alter_table(_TABLE) as batch_op:
        if not _has_column(insp, _TABLE, "rpe"):
            batch_op.add_column(sa.Column("rpe", sa.Integer(), nullable=True))

    if "daily_checkins" not in insp.get_table_names():
        op.create_table(
            "daily_checkins",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("date", sa.Date(), nullable=False),
            sa.Column("soreness", sa.Integer(), nullable=True),
            sa.Column("energy", sa.Integer(), nullable=True),
            sa.Column("mood", sa.Integer(), nullable=True),
            sa.Column("soreness_note", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("user_id", "date", name="uq_daily_checkins_user_date"),
        )
        op.create_index("ix_daily_checkins_date", "daily_checkins", ["date"])
        op.create_index("ix_daily_checkins_user_id", "daily_checkins", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_daily_checkins_user_id", "daily_checkins")
    op.drop_index("ix_daily_checkins_date", "daily_checkins")
    op.drop_table("daily_checkins")
    with op.batch_alter_table(_TABLE) as batch_op:
        batch_op.drop_column("rpe")
