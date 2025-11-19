"""Create file_batches and patient_files tables by running the migration"""
import asyncio
import sys
import os

# Add app directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_dir = os.path.join(backend_dir, 'app')
sys.path.insert(0, app_dir)

from db.database import engine, init_connector
from sqlalchemy import text


async def create_tables():
    """Run the migration to create file_batches and patient_files tables"""
    await init_connector()
    
    migration_file = os.path.join(backend_dir, 'migrations', 'create_file_batches_and_patient_files.sql')
    
    if not os.path.exists(migration_file):
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"Reading migration file: {migration_file}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    # Split by semicolons to execute statements one by one
    statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
    async with engine.begin() as conn:
        print(f"Executing {len(statements)} SQL statements...")
        for i, statement in enumerate(statements, 1):
            if statement:
                try:
                    print(f"  [{i}/{len(statements)}] Executing statement...")
                    await conn.execute(text(statement))
                    print(f"  ✓ Statement {i} executed successfully")
                except Exception as e:
                    # Check if it's a "already exists" error (which is OK)
                    error_msg = str(e).lower()
                    if "already exists" in error_msg or "duplicate" in error_msg:
                        print(f"  ⚠ Statement {i} skipped (already exists): {str(e)[:100]}")
                    else:
                        print(f"  ✗ Statement {i} failed: {str(e)}")
                        raise
    
    # Verify tables were created
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('file_batches', 'patient_files')
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        
        # Check if enum type exists
        result = await conn.execute(text("""
            SELECT typname 
            FROM pg_type 
            WHERE typname = 'file_batch_category'
        """))
        
        enum_exists = result.scalar() is not None
        
        if 'file_batches' in tables and 'patient_files' in tables and enum_exists:
            print("\n✅ Migration completed successfully!")
            print(f"   Tables created: {', '.join(tables)}")
            print(f"   Enum type 'file_batch_category' exists: {enum_exists}")
            return True
        else:
            print("\n❌ Migration completed but verification failed!")
            print(f"   Tables found: {tables}")
            print(f"   Enum exists: {enum_exists}")
            return False


if __name__ == "__main__":
    try:
        result = asyncio.run(create_tables())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"\n❌ Error running migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

