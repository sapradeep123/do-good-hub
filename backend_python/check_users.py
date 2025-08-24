import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.connection import DATABASE_URL
from app.models.models import Profile
from passlib.context import CryptContext

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def check_users():
    """Check existing users and their credentials"""
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("=== USER CREDENTIALS CHECK ===")
        
        # Get all profiles
        profiles = session.query(Profile).all()
        
        print(f"Total users: {len(profiles)}")
        print()
        
        for profile in profiles:
            print(f"👤 {profile.email}")
            print(f"   Role: {profile.role}")
            print(f"   Name: {profile.first_name} {profile.last_name}")
            print(f"   Phone: {profile.phone}")
            print(f"   User ID: {profile.user_id}")
            
            # Test password verification
            test_password = "password"
            if profile.password_hash:
                is_valid = pwd_context.verify(test_password, profile.password_hash)
                print(f"   Password 'password' valid: {is_valid}")
            else:
                print(f"   Password hash: None")
            print()
        
        # Check for specific test users
        test_emails = [
            "admin@dogoodhub.com",
            "user@example.com", 
            "vendor@example.com",
            "ngo@example.com"
        ]
        
        print("=== TEST USER AVAILABILITY ===")
        for email in test_emails:
            user = session.query(Profile).filter(Profile.email == email).first()
            if user:
                print(f"✅ {email} - Role: {user.role}")
            else:
                print(f"❌ {email} - NOT FOUND")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")

if __name__ == "__main__":
    check_users()