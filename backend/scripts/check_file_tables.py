"""Check if file_batches and patient_files tables exist"""
import asyncio
import sys
import os

# Add app directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_dir = os.path.join(backend_dir, 'app')
sys.path.insert(0, app_dir)

from db.database import engine, init_connector
from sqlalchemy import text


async def check_tables():
    """Check if file_batches and patient_files tables exist"""
    await init_connector()
    
    async with engine.begin() as conn:
        # Check if tables exist
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('file_batches', 'patient_files')
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        print(f"Found tables: {tables}")
        
        # Check if enum type exists
        result = await conn.execute(text("""
            SELECT typname 
            FROM pg_type 
            WHERE typname = 'file_batch_category'
        """))
        
        enum_exists = result.scalar() is not None
        print(f"Enum type 'file_batch_category' exists: {enum_exists}")
        
        if 'file_batches' not in tables or 'patient_files' not in tables:
            print("\n❌ ERROR: Required tables are missing!")
            print("   Please run the migration: backend/migrations/create_file_batches_and_patient_files.sql")
            return False
        
        if not enum_exists:
            print("\n❌ ERROR: Enum type 'file_batch_category' is missing!")
            print("   Please run the migration: backend/migrations/create_file_batches_and_patient_files.sql")
            return False
        
        print("\n✅ All required tables and types exist!")
        return True


if __name__ == "__main__":
    try:
        result = asyncio.run(check_tables())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"Error checking tables: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

