"""add coach_memories table

Revision ID: l5m6n7o8p9q0
Revises: k4l5m6n7o8p9
Create Date: 2026-07-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "l5m6n7o8p9q0"
down_revision: Union[str, None] = "k4l5m6n7o8p9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    if "coach_memories" not in insp.get_table_names():
        op.create_table(
            "coach_memories",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("category", sa.String(20), nullable=False, server_default="note"),
            sa.Column("tag", sa.Text(), nullable=False),
            sa.Column("note", sa.Text(), nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_coach_memories_user_id", "coach_memories", ["user_id"])
        op.create_index("ix_coach_memories_created_at", "coach_memories", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_coach_memories_created_at", "coach_memories")
    op.drop_index("ix_coach_memories_user_id", "coach_memories")
    op.drop_table("coach_memories")
