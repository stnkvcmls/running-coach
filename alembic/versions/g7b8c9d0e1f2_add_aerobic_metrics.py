"""add aerobic decoupling and efficiency factor to activities

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "g7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    existing = {col["name"] for col in insp.get_columns("activities")}
    if "decoupling_pct" not in existing:
        op.add_column("activities", sa.Column("decoupling_pct", sa.Float(), nullable=True))
    if "efficiency_factor" not in existing:
        op.add_column("activities", sa.Column("efficiency_factor", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("activities", "efficiency_factor")
    op.drop_column("activities", "decoupling_pct")
