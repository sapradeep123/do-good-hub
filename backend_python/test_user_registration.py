import asyncio
import sys
import os
import json

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.connection import AsyncSessionLocal
from app.models.models import Profile, NGO, Vendor
from app.middleware.auth import get_password_hash
from sqlalchemy import select
import uuid

async def test_user_registration():
    """Test creating different types of users"""
    async with AsyncSessionLocal() as db:
        try:
            # Test creating a regular user
            regular_user = Profile(
                user_id=uuid.uuid4(),
                first_name="Test",
                last_name="User",
                email="testuser@example.com",
                phone="1234567890",
                password_hash=get_password_hash("TestPass123"),
                role="user"
            )
            
            # Test creating a vendor user
            vendor_user = Profile(
                user_id=uuid.uuid4(),
                first_name="Vendor",
                last_name="Owner",
                email="vendor@example.com",
                phone="1234567891",
                password_hash=get_password_hash("VendorPass123"),
                role="vendor"
            )
            
            # Test creating an NGO user
            ngo_user = Profile(
                user_id=uuid.uuid4(),
                first_name="NGO",
                last_name="Manager",
                email="ngo@example.com",
                phone="1234567892",
                password_hash=get_password_hash("NGOPass123"),
                role="ngo"
            )
            
            # Check if users already exist
            for user in [regular_user, vendor_user, ngo_user]:
                stmt = select(Profile).where(Profile.email == user.email)
                result = await db.execute(stmt)
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"User {user.email} already exists with role: {existing_user.role}")
                else:
                    db.add(user)
                    print(f"Created new user: {user.email} with role: {user.role}")
            
            await db.commit()
            print("\nUser registration test completed successfully!")
            
            # Show final user counts
            from sqlalchemy import text
            result = await db.execute(text("SELECT COUNT(*) as count, role FROM profiles GROUP BY role ORDER BY role"))
            user_counts = result.fetchall()
            
            print("\n=== UPDATED USER COUNTS BY ROLE ===")
            for count, role in user_counts:
                print(f"  {role}: {count} users")
                
        except Exception as e:
            print(f"Error during user registration test: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(test_user_registration())