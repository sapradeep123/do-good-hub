#!/usr/bin/env python3

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db_session
from app.models.models import Profile
from app.middleware.auth import verify_password

async def test_admin_login():
    """Test admin login credentials"""
    print("🔍 Testing Admin Login...")
    
    try:
        # Get database session
        async for db in get_db_session():
            # Find admin user
            stmt = select(Profile).where(Profile.email == "admin@dogoodhub.com")
            result = await db.execute(stmt)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                print("❌ Admin user not found!")
                return
            
            print(f"✅ Admin user found: {admin_user.email}")
            print(f"   Role: {admin_user.role}")
            print(f"   Name: {admin_user.first_name} {admin_user.last_name}")
            print(f"   Password hash: {admin_user.password_hash[:50]}...")
            
            # Test password verification
            test_password = "password"
            try:
                is_valid = verify_password(test_password, admin_user.password_hash)
                print(f"   Password '{test_password}' verification: {'✅ VALID' if is_valid else '❌ INVALID'}")
            except Exception as e:
                print(f"   Password verification error: {e}")
                print(f"   Error type: {type(e).__name__}")
            
            break
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_admin_login())