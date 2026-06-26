"""fix avg_stride from cm to m

Revision ID: g8h9i0j1k2l3
Revises: f6a7b8c9d0e1
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "g8h9i0j1k2l3"
down_revision: Union[str, None] = "g7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Garmin's avgStrideLength is in centimetres; previously stored raw.
    # Divide any value > 5 (impossible as metres, plausible as cm) by 100.
    op.execute(
        "UPDATE activities SET avg_stride = avg_stride / 100.0 WHERE avg_stride > 5"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE activities SET avg_stride = avg_stride * 100.0 WHERE avg_stride <= 5"
    )
