"""add ai_jobs table for durable task queue

Revision ID: h1i2j3k4l5m6
Revises: f6a7b8c9d0e1
Create Date: 2026-06-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "h1i2j3k4l5m6"
down_revision: Union[str, None] = "g8h9i0j1k2l3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    if "ai_jobs" not in insp.get_table_names():
        op.create_table(
            "ai_jobs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("task_type", sa.String(50), nullable=False),
            sa.Column("payload_json", sa.Text(), nullable=True),
            sa.Column("status", sa.String(20), nullable=False, default="pending"),
            sa.Column("attempts", sa.Integer(), nullable=False, default=0),
            sa.Column("max_attempts", sa.Integer(), nullable=False, default=3),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("started_at", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_ai_jobs_user_id", "ai_jobs", ["user_id"])
        op.create_index("ix_ai_jobs_status", "ai_jobs", ["status"])
        op.create_index("ix_ai_jobs_created_at", "ai_jobs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_ai_jobs_created_at", "ai_jobs")
    op.drop_index("ix_ai_jobs_status", "ai_jobs")
    op.drop_index("ix_ai_jobs_user_id", "ai_jobs")
    op.drop_table("ai_jobs")
