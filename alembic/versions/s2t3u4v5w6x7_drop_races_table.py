"""drop orphan races table

Revision ID: s2t3u4v5w6x7
Revises: r1s2t3u4v5w6
Create Date: 2026-11-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "s2t3u4v5w6x7"
down_revision: Union[str, None] = "r1s2t3u4v5w6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    if "races" in insp.get_table_names():
        existing_indexes = {ix["name"] for ix in insp.get_indexes("races")}
        if "ix_races_date" in existing_indexes:
            op.drop_index("ix_races_date", table_name="races")
        if "ix_races_user_id" in existing_indexes:
            op.drop_index("ix_races_user_id", table_name="races")
        op.drop_table("races")


def downgrade() -> None:
    op.create_table(
        "races",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("distance_label", sa.Text(), nullable=True),
        sa.Column("goal_time_sec", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_races_date", "races", ["date"], unique=False)
    op.create_index("ix_races_user_id", "races", ["user_id"], unique=False)
