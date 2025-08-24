#!/usr/bin/env python3
"""
Debug script to understand login issues
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Test credentials
TEST_USERS = {
    "admin": {
        "email": "admin@dogoodhub.com",
        "password": "password"
    },
    "vendor": {
        "email": "vendor@example.com", 
        "password": "password"
    },
    "ngo": {
        "email": "ngo@example.com",
        "password": "password"
    }
}

def test_login_detailed(user_type):
    """Test login with detailed error reporting."""
    user_data = TEST_USERS[user_type]
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    print(f"\n=== Testing login for {user_type} ===")
    print(f"Email: {user_data['email']}")
    print(f"Login data: {json.dumps(login_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            try:
                response_json = response.json()
                print(f"Response JSON: {json.dumps(response_json, indent=2)}")
                return response_json.get("access_token")
            except:
                print("Could not parse JSON response")
        
        return None
        
    except Exception as e:
        print(f"Login error for {user_type}: {e}")
        return None

def test_health_check():
    """Test if the API is running."""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def main():
    print("=== LOGIN DEBUG SCRIPT ===")
    
    # Test health first
    if not test_health_check():
        print("API is not responding. Make sure the server is running.")
        return
    
    # Test login for each user type
    for user_type in TEST_USERS.keys():
        token = test_login_detailed(user_type)
        if token:
            print(f"✅ Login successful for {user_type}")
            print(f"Token: {token[:50]}...")
        else:
            print(f"❌ Login failed for {user_type}")

if __name__ == "__main__":
    main()