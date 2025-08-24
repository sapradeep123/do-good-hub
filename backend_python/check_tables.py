import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.connection import AsyncSessionLocal
from sqlalchemy import text

async def check_database_tables():
    """Check if all required tables exist and their structure"""
    async with AsyncSessionLocal() as db:
        try:
            # Check if profiles table exists and its structure
            result = await db.execute(text("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name IN ('profiles', 'ngos', 'vendors')
                ORDER BY table_name, ordinal_position;
            """))
            
            tables_info = result.fetchall()
            
            if not tables_info:
                print("No authentication tables found in database!")
                return
            
            current_table = None
            for row in tables_info:
                table_name, column_name, data_type, is_nullable = row
                if table_name != current_table:
                    print(f"\n=== {table_name.upper()} TABLE ===")
                    current_table = table_name
                print(f"  {column_name}: {data_type} ({'NULL' if is_nullable == 'YES' else 'NOT NULL'})")
            
            # Check if we have any users in the profiles table
            result = await db.execute(text("SELECT COUNT(*) as count, role FROM profiles GROUP BY role"))
            user_counts = result.fetchall()
            
            print("\n=== USER COUNTS BY ROLE ===")
            for count, role in user_counts:
                print(f"  {role}: {count} users")
                
        except Exception as e:
            print(f"Error checking database tables: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(check_database_tables())