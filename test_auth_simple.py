#!/usr/bin/env python3
"""
Simple authentication test using API endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_admin_login():
    """Test admin login with different possible credentials"""
    print("🔐 Testing Admin Authentication\n")
    
    # Possible admin credentials to try
    admin_credentials = [
        {"email": "admin@dogoodhub.com", "password": "password"},
        {"email": "admin@dogoodhub.com", "password": "admin123"},
        {"email": "admin@dogoodhub.com", "password": "admin"},
        {"email": "testuser2@gmail.com", "password": "password"},  # From mock data
    ]
    
    session = requests.Session()
    
    for i, creds in enumerate(admin_credentials, 1):
        print(f"🔑 Attempt {i}: {creds['email']} / {creds['password']}")
        
        try:
            response = session.post(f"{BASE_URL}/api/auth/login", json=creds)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ SUCCESS! Login successful")
                    print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
                    
                    # Test the token
                    if 'access_token' in data:
                        token = data['access_token']
                        headers = {"Authorization": f"Bearer {token}"}
                        me_response = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
                        print(f"   Token test status: {me_response.status_code}")
                        if me_response.status_code == 200:
                            user_data = me_response.json()
                            print(f"   User info: {user_data.get('email', 'N/A')} ({user_data.get('user_type', 'N/A')})")
                    
                    return True
                except Exception as e:
                    print(f"   ❌ Error parsing response: {e}")
            else:
                try:
                    error_data = response.json()
                    print(f"   ❌ Failed: {error_data.get('message', 'Unknown error')}")
                except:
                    print(f"   ❌ Failed: {response.text[:100]}")
                    
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            
        print()
    
    print("❌ All admin login attempts failed")
    return False

def test_user_registration_and_login():
    """Test creating a new user and logging in"""
    print("👤 Testing User Registration and Login\n")
    
    session = requests.Session()
    
    # Test user data
    test_user = {
        "email": "test_connection@example.com",
        "password": "testpass123",
        "full_name": "Test Connection User",
        "user_type": "individual"
    }
    
    # Register user
    print(f"📝 Registering user: {test_user['email']}")
    try:
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json=test_user)
        print(f"   Registration status: {reg_response.status_code}")
        
        if reg_response.status_code in [200, 201]:
            print("   ✅ Registration successful")
        elif reg_response.status_code == 400:
            # User might already exist
            error_data = reg_response.json()
            if "already exists" in error_data.get('message', '').lower():
                print("   ⚠️  User already exists, proceeding to login test")
            else:
                print(f"   ❌ Registration failed: {error_data.get('message', 'Unknown error')}")
        else:
            print(f"   ❌ Registration failed with status {reg_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Registration exception: {e}")
    
    # Test login
    print(f"\n🔑 Testing login: {test_user['email']}")
    try:
        login_data = {"email": test_user['email'], "password": test_user['password']}
        login_response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"   Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            print("   ✅ Login successful")
            
            # Test token
            if 'access_token' in data:
                token = data['access_token']
                headers = {"Authorization": f"Bearer {token}"}
                me_response = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
                print(f"   Token test status: {me_response.status_code}")
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print(f"   ✅ Token valid - User: {user_data.get('email', 'N/A')}")
                    return True
            
        else:
            error_data = login_response.json()
            print(f"   ❌ Login failed: {error_data.get('message', 'Unknown error')}")
            
    except Exception as e:
        print(f"   ❌ Login exception: {e}")
    
    return False

def main():
    print("🚀 Simple Authentication Test\n")
    print(f"Backend URL: {BASE_URL}\n")
    
    # Test health first
    try:
        health_response = requests.get(f"{BASE_URL}/health")
        print(f"🏥 Health check: {health_response.status_code}")
        if health_response.status_code != 200:
            print("❌ Backend is not healthy, stopping tests")
            return
    except Exception as e:
        print(f"❌ Cannot reach backend: {e}")
        return
    
    print("✅ Backend is reachable\n")
    
    # Test admin login
    admin_success = test_admin_login()
    
    # Test regular user registration and login
    user_success = test_user_registration_and_login()
    
    print("\n📊 Summary:")
    print(f"Admin Login: {'✅ SUCCESS' if admin_success else '❌ FAILED'}")
    print(f"User Registration/Login: {'✅ SUCCESS' if user_success else '❌ FAILED'}")
    
    if admin_success or user_success:
        print("\n🎉 Authentication is working!")
    else:
        print("\n⚠️  Authentication issues detected")

if __name__ == "__main__":
    main()