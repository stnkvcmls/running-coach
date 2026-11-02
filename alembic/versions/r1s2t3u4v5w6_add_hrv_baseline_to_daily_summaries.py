"""add Garmin HRV baseline range to daily_summaries

Revision ID: r1s2t3u4v5w6
Revises: q0r1s2t3u4v5
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "r1s2t3u4v5w6"
down_revision: Union[str, None] = "q0r1s2t3u4v5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "daily_summaries"
_COLUMNS = ("hrv_baseline_low", "hrv_baseline_high")


def _has_column(insp: object, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def upgrade() -> None:
    insp = inspect(op.get_bind())

    with op.batch_alter_table(_TABLE) as batch_op:
        for col in _COLUMNS:
            if not _has_column(insp, _TABLE, col):
                batch_op.add_column(sa.Column(col, sa.Float(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table(_TABLE) as batch_op:
        for col in reversed(_COLUMNS):
            batch_op.drop_column(col)
