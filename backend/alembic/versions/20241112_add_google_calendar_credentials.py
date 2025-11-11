"""add google calendar credentials table

Revision ID: 20241112_add_google_calendar_credentials
Revises: 
Create Date: 2025-11-11 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20241112_add_google_calendar_credentials"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "google_calendar_credentials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_type", sa.String(length=50), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_credentials", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_google_calendar_credentials_id"),
        "google_calendar_credentials",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_google_calendar_credentials_user_id"),
        "google_calendar_credentials",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_google_calendar_credentials_user_id"),
        table_name="google_calendar_credentials",
    )
    op.drop_index(
        op.f("ix_google_calendar_credentials_id"),
        table_name="google_calendar_credentials",
    )
    op.drop_table("google_calendar_credentials")

