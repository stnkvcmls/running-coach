"""add target_weekly_km to athlete_profiles

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "athlete_profiles"


def _has_column(insp: object, table: str, col: str) -> bool:
    return any(c["name"] == col for c in insp.get_columns(table))


def upgrade() -> None:
    insp = inspect(op.get_bind())
    with op.batch_alter_table(_TABLE) as batch_op:
        if not _has_column(insp, _TABLE, "target_weekly_km"):
            batch_op.add_column(sa.Column("target_weekly_km", sa.Float(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table(_TABLE) as batch_op:
        batch_op.drop_column("target_weekly_km")
