import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.connection import DATABASE_URL
from app.models.models import Profile
from app.middleware.auth import get_password_hash

def reset_test_passwords():
    """Reset passwords for test users to 'password'"""
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("=== RESETTING TEST USER PASSWORDS ===")
        
        # Test users to reset
        test_emails = [
            "admin@dogoodhub.com",
            "vendor@example.com",
            "ngo@example.com",
            "testuser@example.com"
        ]
        
        new_password = "password"
        new_password_hash = get_password_hash(new_password)
        
        print(f"New password hash: {new_password_hash[:50]}...")
        print()
        
        for email in test_emails:
            user = session.query(Profile).filter(Profile.email == email).first()
            if user:
                old_hash = user.password_hash[:50] + "..." if user.password_hash else "None"
                user.password_hash = new_password_hash
                session.commit()
                print(f"✅ {email}")
                print(f"   Old hash: {old_hash}")
                print(f"   New hash: {new_password_hash[:50]}...")
                print(f"   Role: {user.role}")
            else:
                print(f"❌ {email} - NOT FOUND")
            print()
        
        session.close()
        print("Password reset completed!")
        
    except Exception as e:
        print(f"❌ Error resetting passwords: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_test_passwords()