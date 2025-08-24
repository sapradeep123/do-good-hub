import asyncio
import uuid
from app.database.connection import AsyncSessionLocal
from app.models.models import Profile
from app.middleware.auth import get_password_hash
from sqlalchemy import select

async def create_admin_user():
    """Create admin user if it doesn't exist"""
    async with AsyncSessionLocal() as db:
        try:
            # Check if admin user exists
            result = await db.execute(select(Profile).where(Profile.email == 'admin@dogoodhub.com'))
            user = result.scalar_one_or_none()
            
            if user:
                print(f"Admin user already exists: {user.email}, role: {user.role}")
                return
            
            # Create admin user
            admin_user = Profile(
                user_id=uuid.uuid4(),
                email="admin@dogoodhub.com",
                first_name="Admin",
                last_name="User",
                password_hash=get_password_hash("Admin@123"),
                role="admin"
            )
            
            db.add(admin_user)
            await db.commit()
            print(f"Admin user created successfully: {admin_user.email}")
        except Exception as e:
            print(f"Error creating admin user: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_admin_user())