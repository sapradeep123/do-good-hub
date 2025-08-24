import asyncio
import asyncpg
from app.database.connection import ASYNC_DATABASE_URL

async def check_vendor_columns():
    # Connect directly to check table structure
    conn = await asyncpg.connect(ASYNC_DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://'))
    
    try:
        # Check if vendors table exists
        result = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vendors'
            ORDER BY ordinal_position;
        """)
        
        if result:
            print("Vendors table columns:")
            for row in result:
                print(f"  {row['column_name']}: {row['data_type']}")
        else:
            print("Vendors table does not exist")
            
        # Also check what tables exist
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        print("\nAll tables in database:")
        for table in tables:
            print(f"  {table['table_name']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_vendor_columns())