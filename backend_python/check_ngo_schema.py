import asyncio
from app.database.connection import get_db_session
from sqlalchemy import text

async def check_ngo_schema():
    """Check the actual columns in the ngos table"""
    async for db in get_db_session():
        try:
            # Check columns in ngos table
            result = await db.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'ngos' 
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            print("\nColumns in 'ngos' table:")
            print("-" * 50)
            for col in columns:
                print(f"{col[0]:<25} {col[1]:<20} {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
            
            # Also check all tables to see what exists
            result = await db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            
            tables = result.fetchall()
            print("\nAll tables in database:")
            print("-" * 30)
            for table in tables:
                print(f"- {table[0]}")
            
            break
        except Exception as e:
            print(f'Error: {e}')
            break

if __name__ == "__main__":
    asyncio.run(check_ngo_schema())