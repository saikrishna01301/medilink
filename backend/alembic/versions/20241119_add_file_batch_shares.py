"""add file batch shares table

Revision ID: 20241119_add_file_batch_shares
Revises: 20241119_remove_preferred_time_slot_end_and_duration
Create Date: 2025-11-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20241119_add_file_batch_shares"
down_revision: Union[str, None] = "20241119_remove_preferred_time_slot_end_and_duration"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "file_batch_shares",
        sa.Column("share_id", sa.Integer(), primary_key=True),
        sa.Column("file_batch_id", sa.Integer(), nullable=False),
        sa.Column("patient_user_id", sa.Integer(), nullable=False),
        sa.Column("doctor_user_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("appointment_request_id", sa.Integer(), nullable=True),
        sa.Column("share_status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("shared_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["file_batch_id"], ["file_batches.file_batch_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.appointment_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["appointment_request_id"], ["appointment_requests.request_id"], ondelete="SET NULL"),
    )
    op.create_check_constraint(
        "ck_file_batch_shares_relation",
        "file_batch_shares",
        "(appointment_id IS NOT NULL) OR (appointment_request_id IS NOT NULL)",
    )
    op.create_index("ix_file_batch_shares_file_batch_id", "file_batch_shares", ["file_batch_id"])
    op.create_index("ix_file_batch_shares_patient_user_id", "file_batch_shares", ["patient_user_id"])
    op.create_index("ix_file_batch_shares_doctor_user_id", "file_batch_shares", ["doctor_user_id"])
    op.create_index("ix_file_batch_shares_share_status", "file_batch_shares", ["share_status"])
    op.create_index("ix_file_batch_shares_shared_at", "file_batch_shares", ["shared_at"])


def downgrade() -> None:
    op.drop_index("ix_file_batch_shares_shared_at", table_name="file_batch_shares")
    op.drop_index("ix_file_batch_shares_share_status", table_name="file_batch_shares")
    op.drop_index("ix_file_batch_shares_doctor_user_id", table_name="file_batch_shares")
    op.drop_index("ix_file_batch_shares_patient_user_id", table_name="file_batch_shares")
    op.drop_index("ix_file_batch_shares_file_batch_id", table_name="file_batch_shares")
    op.drop_constraint("ck_file_batch_shares_relation", "file_batch_shares")
    op.drop_table("file_batch_shares")

