"""
Script to check the users table structure in CloudSQL
Run from project root: python backend/check_users_table.py
Or from backend directory: python -m check_users_table
"""
import asyncio
import sys
import os

# Get the backend directory (where this script is located)
backend_dir = os.path.dirname(os.path.abspath(__file__))
# Add backend directory to the path so 'db' and 'core' modules can be found
sys.path.insert(0, backend_dir)

# Change to app directory to match how the app runs (so imports like 'from db import Base' work)
app_dir = os.path.join(backend_dir, 'app')
os.chdir(app_dir)
sys.path.insert(0, app_dir)

from db.database import init_connector, getconn, close_connector
from core.config import config


async def check_users_table():
    """Query CloudSQL to get the users table structure"""
    try:
        # Initialize the connector
        await init_connector()
        
        # Get a connection
        conn = await getconn()
        
        try:
            # Query to get table structure with more details
            query = """
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                numeric_precision,
                numeric_scale,
                is_nullable,
                column_default,
                CASE 
                    WHEN character_maximum_length IS NOT NULL 
                    THEN data_type || '(' || character_maximum_length || ')'
                    WHEN numeric_precision IS NOT NULL 
                    THEN data_type || '(' || numeric_precision || 
                         CASE WHEN numeric_scale IS NOT NULL THEN ',' || numeric_scale ELSE '' END || ')'
                    ELSE data_type
                END as full_data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
            """
            
            rows = await conn.fetch(query)
            
            if not rows:
                print("⚠️  Table 'users' not found in the database.")
                return
            
            print("=" * 80)
            print("USERS TABLE STRUCTURE IN CLOUDSQL")
            print("=" * 80)
            print(f"\nTable: users")
            print(f"Database: {config.DB_NAME}")
            print(f"Instance: {config.INSTANCE_CONNECTION_NAME}\n")
            print("-" * 80)
            print(f"{'Column Name':<25} {'Data Type':<30} {'Nullable':<10} {'Default'}")
            print("-" * 80)
            
            for row in rows:
                col_name = row['column_name']
                full_data_type = row['full_data_type']
                nullable = row['is_nullable']
                default = str(row['column_default']) if row['column_default'] else 'None'
                # Remove the sequence part from default for cleaner display
                if 'nextval' in default:
                    default = 'AUTO_INCREMENT'
                
                print(f"{col_name:<25} {full_data_type:<30} {nullable:<10} {default}")
            
            print("-" * 80)
            
            # Also check for constraints (unique, primary key, foreign key)
            constraints_query = """
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'users'
            ORDER BY tc.constraint_type, kcu.column_name;
            """
            
            # Also check unique indexes (which might not show as constraints)
            unique_indexes_query = """
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'users' 
            AND indexdef LIKE '%UNIQUE%'
            AND indexname NOT LIKE '%pkey%';
            """
            
            constraint_rows = await conn.fetch(constraints_query)
            
            if constraint_rows:
                print("\n" + "=" * 80)
                print("CONSTRAINTS")
                print("=" * 80)
                for row in constraint_rows:
                    print(f"{row['constraint_type']:<20} on column: {row['column_name']:<25} ({row['constraint_name']})")
            
            # Check unique indexes that might not be explicit constraints
            unique_idx_rows = await conn.fetch(unique_indexes_query)
            if unique_idx_rows:
                print("\n" + "=" * 80)
                print("UNIQUE INDEXES (Additional Unique Constraints)")
                print("=" * 80)
                for row in unique_idx_rows:
                    print(f"Index: {row['indexname']}")
                    # Extract column name from index definition
                    import re
                    match = re.search(r'\((\w+)\)', row['indexdef'])
                    if match:
                        col_name = match.group(1)
                        print(f"  Unique on column: {col_name}")
            
            # Check indexes
            indexes_query = """
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'users';
            """
            
            index_rows = await conn.fetch(indexes_query)
            
            if index_rows:
                print("\n" + "=" * 80)
                print("INDEXES")
                print("=" * 80)
                for row in index_rows:
                    print(f"Index: {row['indexname']}")
                    print(f"  Definition: {row['indexdef']}\n")
            
            # Count total rows
            count_query = "SELECT COUNT(*) as total FROM users;"
            count_result = await conn.fetchrow(count_query)
            print("=" * 80)
            print(f"Total records in users table: {count_result['total']}")
            print("=" * 80)
            
        finally:
            await conn.close()
            
    except Exception as e:
        print(f"❌ Error connecting to CloudSQL: {e}")
        print("\nMake sure:")
        print("1. You have a .env file with CloudSQL credentials")
        print("2. You're authenticated with GCP (run: gcloud auth application-default login)")
        print("3. Cloud SQL instance is running")
        sys.exit(1)
    finally:
        await close_connector()


if __name__ == "__main__":
    asyncio.run(check_users_table())

