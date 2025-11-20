"""
Script to clear all data from appointments and notifications tables.

WARNING: This will permanently delete all data from:
- appointments table
- notifications table

Usage:
    python clear_appointments_and_notifications.py [--yes]
    
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
from db.models import Notification, Appointment


async def clear_tables():
    """Clear all data from appointments and notifications tables"""
    await init_connector()
    
    async with sessionLocal() as session:
        try:
            print("=" * 80)
            print("CLEARING DATA FROM APPOINTMENTS AND NOTIFICATIONS TABLES")
            print("=" * 80)
            print()
            
            # Step 1: Delete notifications first (they may reference appointments)
            print("Step 1: Deleting all notifications...")
            result = await session.execute(delete(Notification))
            notifications_deleted = result.rowcount
            print(f"  [OK] Deleted {notifications_deleted} notifications")
            print()
            
            # Step 2: Delete appointments
            print("Step 2: Deleting all appointments...")
            result = await session.execute(delete(Appointment))
            appointments_deleted = result.rowcount
            print(f"  [OK] Deleted {appointments_deleted} appointments")
            print()
            
            # Commit the transaction
            await session.commit()
            
            print("=" * 80)
            print("[SUCCESS] All data has been cleared!")
            print(f"   - Notifications deleted: {notifications_deleted}")
            print(f"   - Appointments deleted: {appointments_deleted}")
            print("=" * 80)
            
        except Exception as e:
            await session.rollback()
            print(f"[ERROR] Failed to clear data: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await session.close()
    
    await close_connector()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Clear all data from appointments and notifications tables')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    # Confirm before proceeding (unless --yes flag is used)
    if not args.yes:
        print()
        print("[WARNING] This will permanently delete ALL data from:")
        print("   - appointments table")
        print("   - notifications table")
        print()
        response = input("Are you sure you want to continue? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            print("Operation cancelled.")
            sys.exit(0)
    
    asyncio.run(clear_tables())

