import asyncio
from app.database.connection import get_db_session
from app.models.models import NGO
from sqlalchemy import select

async def check_ngos():
    async for db in get_db_session():
        try:
            result = await db.execute(select(NGO))
            ngos = result.scalars().all()
            print('NGOs in database:')
            if not ngos:
                print('No NGOs found in database')
            else:
                for ngo in ngos:
                    print(f'ID: {ngo.id}, Name: {ngo.name}, Email: {ngo.email}')
            break
        except Exception as e:
            print(f'Error: {e}')
            break

if __name__ == "__main__":
    asyncio.run(check_ngos())