"""add actions_json to chat_messages

Revision ID: k4l5m6n7o8p9
Revises: j3k4l5m6n7o8
Create Date: 2026-06-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "k4l5m6n7o8p9"
down_revision: Union[str, None] = "j3k4l5m6n7o8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("chat_messages")}
    if "actions_json" not in cols:
        op.add_column("chat_messages", sa.Column("actions_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "actions_json")
