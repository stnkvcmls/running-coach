"""add personal_records table

Revision ID: n7o8p9q0r1s2
Revises: m6n7o8p9q0r1
Create Date: 2026-07-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "n7o8p9q0r1s2"
down_revision: Union[str, None] = "m6n7o8p9q0r1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    existing = insp.get_table_names()

    if "personal_records" not in existing:
        op.create_table(
            "personal_records",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), nullable=False, default=1),
            sa.Column("record_type", sa.String(20), nullable=False),
            sa.Column("metric", sa.String(20), nullable=True),
            sa.Column("duration_sec", sa.Integer(), nullable=True),
            sa.Column("distance_label", sa.Text(), nullable=True),
            sa.Column("value", sa.Float(), nullable=False),
            sa.Column("previous_value", sa.Float(), nullable=True),
            sa.Column("activity_id", sa.Integer(), nullable=False),
            sa.Column("achieved_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_personal_records_user_id", "personal_records", ["user_id"])
        op.create_index("ix_personal_records_record_type", "personal_records", ["record_type"])
        op.create_index("ix_personal_records_activity_id", "personal_records", ["activity_id"])
        op.create_index("ix_personal_records_achieved_at", "personal_records", ["achieved_at"])
        op.create_index("ix_personal_records_created_at", "personal_records", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_personal_records_created_at", "personal_records")
    op.drop_index("ix_personal_records_achieved_at", "personal_records")
    op.drop_index("ix_personal_records_activity_id", "personal_records")
    op.drop_index("ix_personal_records_record_type", "personal_records")
    op.drop_index("ix_personal_records_user_id", "personal_records")
    op.drop_table("personal_records")
