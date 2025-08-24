#!/usr/bin/env python3
"""
Test script to create a test user and test the email login functionality.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db_session
from app.models.models import Profile
from app.middleware.auth import get_password_hash
from app.utils.email_service import email_service
import uuid

async def create_test_user_and_test_email():
    """Create a test user and test email functionality."""
    # Get database session
    from app.database.connection import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            # Check if test user already exists
            test_email = "testuser@example.com"
            stmt = select(Profile).where(Profile.email == test_email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"Test user {test_email} already exists")
                test_user = existing_user
            else:
                # Create test user
                print(f"Creating test user: {test_email}")
                test_user = Profile(
                    user_id=uuid.uuid4(),
                    email=test_email,
                    password_hash=get_password_hash("TestUser@123"),
                    first_name="Test",
                    last_name="User",
                    role="user",
                    created_at=datetime.utcnow()
                )
                db.add(test_user)
                await db.commit()
                await db.refresh(test_user)
                print(f"Test user created successfully with ID: {test_user.id}")
            
            # Test email functionality
            print("\nTesting email functionality...")
            user_full_name = f"{test_user.first_name} {test_user.last_name}"
            
            email_sent = await email_service.send_login_welcome_email(
                db=db,
                user_name=user_full_name,
                user_email=test_user.email,
                user_role=test_user.role
            )
            
            if email_sent:
                print(f"✅ Welcome email sent successfully to {test_user.email}")
            else:
                print(f"⚠️ Welcome email could not be sent to {test_user.email}")
                print("This might be due to email configuration not being set up.")
            
            # Display user information
            print(f"\nTest User Details:")
            print(f"- ID: {test_user.id}")
            print(f"- Email: {test_user.email}")
            print(f"- Name: {user_full_name}")
            print(f"- Role: {test_user.role}")
            print(f"- Password: TestUser@123")
            
            return test_user
            
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()
            return None

if __name__ == "__main__":
    print("Testing Email Login Functionality")
    print("=" * 40)
    
    user = asyncio.run(create_test_user_and_test_email())
    
    if user:
        print("\n✅ Test completed successfully!")
        print(f"You can now test login with: {user.email} / TestUser@123")
    else:
        print("\n❌ Test failed!")