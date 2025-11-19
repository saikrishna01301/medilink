"""
Diagnostic script to investigate why all doctors are not being listed.
This script will:
1. List all users with role='doctor'
2. Check which ones have doctor_profiles
3. Check which ones have accepting_new_patients=True
4. Show the difference between all doctors and those returned by the API
"""
import asyncio
import sys
import os

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
app_dir = os.path.join(backend_dir, 'app')
sys.path.insert(0, app_dir)

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_session, init_connector, close_connector
from db.models.user_model import User, UserRoleEnum
from db.models.doctor_model import DoctorProfile
from db.crud import doctor_crud


async def investigate_doctors():
    """Investigate all doctors in the database"""
    await init_connector()
    
    async for session in get_session():
        try:
            print("=" * 80)
            print("DOCTOR INVESTIGATION REPORT")
            print("=" * 80)
            print()
            
            # 1. Get all users with role='doctor'
            print("1. ALL USERS WITH ROLE='doctor':")
            print("-" * 80)
            all_doctors_stmt = select(User).where(User.role == UserRoleEnum.doctor)
            all_doctors_result = await session.execute(all_doctors_stmt)
            all_doctors = all_doctors_result.scalars().all()
            
            print(f"   Total doctors in users table: {len(all_doctors)}")
            print()
            
            for doctor in all_doctors:
                print(f"   - ID: {doctor.id}, Name: {doctor.first_name} {doctor.last_name}, Email: {doctor.email}")
            print()
            
            # 2. Get all doctor profiles
            print("2. ALL DOCTOR PROFILES:")
            print("-" * 80)
            profiles_stmt = select(DoctorProfile)
            profiles_result = await session.execute(profiles_stmt)
            all_profiles = profiles_result.scalars().all()
            
            print(f"   Total doctor profiles: {len(all_profiles)}")
            print()
            
            doctor_ids_with_profiles = set()
            for profile in all_profiles:
                doctor_ids_with_profiles.add(profile.user_id)
                print(f"   - User ID: {profile.user_id}, Accepting New Patients: {profile.accepting_new_patients}, Specialty: {profile.specialty}")
            print()
            
            # 3. Doctors without profiles
            print("3. DOCTORS WITHOUT PROFILES:")
            print("-" * 80)
            doctors_without_profiles = [d for d in all_doctors if d.id not in doctor_ids_with_profiles]
            print(f"   Count: {len(doctors_without_profiles)}")
            for doctor in doctors_without_profiles:
                print(f"   - ID: {doctor.id}, Name: {doctor.first_name} {doctor.last_name}, Email: {doctor.email}")
            print()
            
            # 4. Doctors with profiles but not accepting new patients
            print("4. DOCTORS WITH PROFILES BUT NOT ACCEPTING NEW PATIENTS:")
            print("-" * 80)
            doctors_not_accepting = []
            for profile in all_profiles:
                if not profile.accepting_new_patients:
                    user_stmt = select(User).where(User.id == profile.user_id)
                    user_result = await session.execute(user_stmt)
                    user = user_result.scalar_one_or_none()
                    if user:
                        doctors_not_accepting.append(user)
                        print(f"   - ID: {user.id}, Name: {user.first_name} {user.last_name}, Email: {user.email}")
            print(f"   Count: {len(doctors_not_accepting)}")
            print()
            
            # 5. Doctors that WOULD be returned by current API (with profile AND accepting new patients)
            print("5. DOCTORS RETURNED BY CURRENT API (has profile AND accepting_new_patients=True):")
            print("-" * 80)
            doctors_returned_by_api = []
            for profile in all_profiles:
                if profile.accepting_new_patients:
                    user_stmt = select(User).where(User.id == profile.user_id)
                    user_result = await session.execute(user_stmt)
                    user = user_result.scalar_one_or_none()
                    if user:
                        doctors_returned_by_api.append(user)
                        print(f"   - ID: {user.id}, Name: {user.first_name} {user.last_name}, Email: {user.email}")
            print(f"   Count: {len(doctors_returned_by_api)}")
            print()
            
            # 6. Summary
            print("=" * 80)
            print("SUMMARY:")
            print("=" * 80)
            print(f"   Total doctors in users table: {len(all_doctors)}")
            print(f"   Doctors with profiles: {len(doctor_ids_with_profiles)}")
            print(f"   Doctors without profiles: {len(doctors_without_profiles)}")
            print(f"   Doctors with profiles but not accepting: {len(doctors_not_accepting)}")
            print(f"   Doctors returned by current API: {len(doctors_returned_by_api)}")
            print()
            print(f"   MISSING DOCTORS: {len(all_doctors) - len(doctors_returned_by_api)}")
            print()
            
            # 7. Test the actual API function
            print("7. TESTING list_doctors_with_profiles() FUNCTION:")
            print("-" * 80)
            try:
                doctors_from_api = await doctor_crud.list_doctors_with_profiles(session)
                print(f"   Doctors returned by API function: {len(doctors_from_api)}")
                print()
                for doctor in doctors_from_api:
                    print(f"   - ID: {doctor['id']}, Name: {doctor['first_name']} {doctor['last_name']}, Email: {doctor['email']}")
            except Exception as e:
                print(f"   ERROR calling API function: {e}")
                import traceback
                traceback.print_exc()
            print()
            
            # 8. Raw SQL query to verify
            print("8. RAW SQL QUERY VERIFICATION:")
            print("-" * 80)
            raw_query = text("""
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.role,
                    dp.profile_id,
                    dp.accepting_new_patients
                FROM users u
                LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
                WHERE u.role = 'doctor'
                ORDER BY u.user_id
            """)
            raw_result = await session.execute(raw_query)
            raw_rows = raw_result.all()
            print(f"   Total doctors (with LEFT JOIN): {len(raw_rows)}")
            print()
            for row in raw_rows:
                has_profile = row.profile_id is not None
                accepting = row.accepting_new_patients if has_profile else None
                print(f"   - ID: {row.user_id}, Name: {row.first_name} {row.last_name}, Has Profile: {has_profile}, Accepting: {accepting}")
            
        finally:
            await session.close()
            break
    
    await close_connector()


if __name__ == "__main__":
    asyncio.run(investigate_doctors())

