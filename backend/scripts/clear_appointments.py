"""
Script to clear all appointment-related data from the database.
This includes:
- Notifications (related to appointments/appointment requests)
- Appointment Requests
- Appointments

WARNING: This will permanently delete all appointment data!

Usage:
    python clear_appointments.py [--yes]
    
    --yes: Skip confirmation prompt
"""
import asyncio
import sys
import os
import argparse

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
app_dir = os.path.join(backend_dir, 'app')
sys.path.insert(0, app_dir)

from sqlalchemy import delete
from db.database import sessionLocal, init_connector, close_connector
from db.models import Notification, AppointmentRequest, Appointment


async def clear_appointments():
    """Clear all appointment-related data from the database"""
    await init_connector()
    
    async with sessionLocal() as session:
        try:
            print("=" * 80)
            print("CLEARING APPOINTMENT DATA FROM DATABASE")
            print("=" * 80)
            print()
            
            # Step 1: Delete notifications first (they reference appointments and appointment_requests)
            print("Step 1: Deleting notifications...")
            result = await session.execute(delete(Notification))
            notifications_deleted = result.rowcount
            print(f"  [OK] Deleted {notifications_deleted} notifications")
            print()
            
            # Step 2: Delete appointment requests (they reference appointments)
            print("Step 2: Deleting appointment requests...")
            result = await session.execute(delete(AppointmentRequest))
            requests_deleted = result.rowcount
            print(f"  [OK] Deleted {requests_deleted} appointment requests")
            print()
            
            # Step 3: Delete appointments
            print("Step 3: Deleting appointments...")
            result = await session.execute(delete(Appointment))
            appointments_deleted = result.rowcount
            print(f"  [OK] Deleted {appointments_deleted} appointments")
            print()
            
            # Commit the transaction
            await session.commit()
            
            print("=" * 80)
            print("[SUCCESS] All appointment data has been cleared!")
            print(f"   - Notifications: {notifications_deleted}")
            print(f"   - Appointment Requests: {requests_deleted}")
            print(f"   - Appointments: {appointments_deleted}")
            print("=" * 80)
            
        except Exception as e:
            await session.rollback()
            print(f"[ERROR] Failed to clear appointment data: {e}")
            raise
        finally:
            await session.close()
    
    await close_connector()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Clear all appointment data from the database')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    # Confirm before proceeding (unless --yes flag is used)
    if not args.yes:
        print()
        print("[WARNING] This will permanently delete ALL appointment data!")
        print("   This includes:")
        print("   - All notifications related to appointments")
        print("   - All appointment requests")
        print("   - All appointments")
        print()
        response = input("Are you sure you want to continue? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            print("Operation cancelled.")
            sys.exit(0)
    
    asyncio.run(clear_appointments())

