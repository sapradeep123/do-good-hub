import asyncio
from app.database.connection import engine
from sqlalchemy import text

async def check_schema():
    """Check the profiles table schema"""
    async with engine.begin() as conn:
        result = await conn.execute(text(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position"
        ))
        columns = result.fetchall()
        print("Profiles table columns:")
        for column_name, data_type in columns:
            print(f"  {column_name}: {data_type}")

if __name__ == "__main__":
    asyncio.run(check_schema())