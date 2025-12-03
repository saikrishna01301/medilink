"""add reschedule_count to appointments

Revision ID: 20250101_add_reschedule_count
Revises: 20241119_add_file_batch_shares
Create Date: 2025-01-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20250101_add_reschedule_count"
down_revision: Union[str, None] = "20241119_add_file_batch_shares"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("reschedule_count", sa.Integer(), nullable=False, server_default="0")
    )


def downgrade() -> None:
    op.drop_column("appointments", "reschedule_count")

