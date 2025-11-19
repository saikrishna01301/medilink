"""remove preferred_time_slot_end and duration_minutes from appointment_requests

Revision ID: 20241119_remove_preferred_time_slot_end_and_duration
Revises: 20241112_add_google_calendar_credentials
Create Date: 2025-11-19 02:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20241119_remove_preferred_time_slot_end_and_duration"
down_revision: Union[str, None] = "20241112_add_google_calendar_credentials"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the columns that are no longer needed
    # Using op.execute with conditional check to avoid errors if columns don't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointment_requests' 
                AND column_name = 'preferred_time_slot_end'
            ) THEN
                ALTER TABLE appointment_requests DROP COLUMN preferred_time_slot_end;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointment_requests' 
                AND column_name = 'duration_minutes'
            ) THEN
                ALTER TABLE appointment_requests DROP COLUMN duration_minutes;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Add the columns back if downgrading
    op.add_column('appointment_requests', sa.Column('preferred_time_slot_end', sa.Time(), nullable=True))
    op.add_column('appointment_requests', sa.Column('duration_minutes', sa.Integer(), nullable=True, server_default='30'))

