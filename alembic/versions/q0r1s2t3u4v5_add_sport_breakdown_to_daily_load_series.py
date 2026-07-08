"""add sport_breakdown_json to daily_load_series

Revision ID: q0r1s2t3u4v5
Revises: p9q0r1s2t3u4
Create Date: 2026-07-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "q0r1s2t3u4v5"
down_revision: Union[str, None] = "p9q0r1s2t3u4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "daily_load_series"


def _has_column(insp: object, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def upgrade() -> None:
    insp = inspect(op.get_bind())

    with op.batch_alter_table(_TABLE) as batch_op:
        if not _has_column(insp, _TABLE, "sport_breakdown_json"):
            batch_op.add_column(sa.Column("sport_breakdown_json", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table(_TABLE) as batch_op:
        batch_op.drop_column("sport_breakdown_json")
