#!/usr/bin/env python3
"""
Simple script to check users in the database
"""

import asyncio
import sys
import os

# Add the backend_python directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend_python'))

from backend_python.app.database.connection import get_database
from backend_python.app.models.user import User
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def check_users():
    """Check what users exist in the database"""
    try:
        # Get database connection
        engine = await get_database()
        
        # Create session
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        print("🔍 Checking users in database...\n")
        
        # Check if users table exists
        result = session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';"))
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("❌ Users table does not exist!")
            return
            
        print("✅ Users table exists")
        
        # Get all users
        result = session.execute(text("SELECT id, email, full_name, user_type, is_active FROM users;"))
        users = result.fetchall()
        
        if not users:
            print("⚠️  No users found in database")
            print("\n💡 You may need to create an admin user first")
            return
            
        print(f"\n👥 Found {len(users)} users:")
        print("-" * 80)
        print(f"{'ID':<36} {'Email':<30} {'Name':<20} {'Type':<15} {'Active'}")
        print("-" * 80)
        
        admin_users = []
        for user in users:
            user_id, email, full_name, user_type, is_active = user
            active_status = "✅" if is_active else "❌"
            print(f"{user_id:<36} {email:<30} {full_name:<20} {user_type:<15} {active_status}")
            
            if user_type == 'admin':
                admin_users.append(email)
                
        print("-" * 80)
        
        if admin_users:
            print(f"\n🔑 Admin users found: {', '.join(admin_users)}")
            print("\n💡 Try logging in with one of these admin emails")
            print("   Default password might be: admin123")
        else:
            print("\n⚠️  No admin users found!")
            print("\n💡 You may need to create an admin user:")
            print("   python create_admin.py")
            
        session.close()
        
    except Exception as e:
        print(f"❌ Error checking users: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_users())