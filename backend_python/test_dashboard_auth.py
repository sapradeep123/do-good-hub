#!/usr/bin/env python3
"""
Test dashboard endpoints with proper authentication to understand 404 vs 401 behavior.
"""

import asyncio
import requests
import json
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Configuration
BASE_URL = "http://localhost:8000"
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"

# Test users from the database
TEST_USERS = {
    "admin": {
        "email": "admin@dogoodhub.com",
        "password": "password",
        "user_id": "73205781-c452-4b42-8fe4-25cbca32457b",
        "role": "admin"
    },
    "vendor": {
        "email": "vendor@example.com",
        "password": "password",
        "user_id": "ad0f2247-7435-4715-b1b4-9ae78dd251c3",
        "role": "vendor"
    },
    "ngo": {
        "email": "ngo@example.com",
        "password": "password",
        "user_id": "73205781-c452-4b42-8fe4-25cbca32457b",
        "role": "ngo"
    }
}

def create_test_token(user_data):
    """Create a JWT token for testing."""
    to_encode = {
        "sub": user_data["user_id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def test_endpoint_with_auth(endpoint, user_type, method="GET"):
    """Test an endpoint with proper authentication."""
    user_data = TEST_USERS[user_type]
    token = create_test_token(user_data)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json={}, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json={}, timeout=10)
        else:
            response = requests.request(method, url, headers=headers, timeout=10)
        
        return {
            "status_code": response.status_code,
            "response": response.text[:200] if response.text else "",
            "headers": dict(response.headers)
        }
    except Exception as e:
        return {
            "status_code": "ERROR",
            "response": str(e),
            "headers": {}
        }

def test_login_endpoint(user_type):
    """Test the login endpoint to get a real token."""
    user_data = TEST_USERS[user_type]
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,  # JSON data as expected by ProfileLogin schema
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            response_data = response.json()
            # Token is nested in data.access_token
            if response_data.get("success") and "data" in response_data:
                return response_data["data"].get("access_token")
            return response_data.get("access_token")  # Fallback
        else:
            print(f"Login failed for {user_type}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error for {user_type}: {e}")
        return None

def test_with_real_token(endpoint, user_type, method="GET"):
    """Test endpoint with real token from login."""
    token = test_login_endpoint(user_type)
    
    if not token:
        return {
            "status_code": "NO_TOKEN",
            "response": "Could not obtain token",
            "headers": {}
        }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json={}, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json={}, timeout=10)
        else:
            response = requests.request(method, url, headers=headers, timeout=10)
        
        return {
            "status_code": response.status_code,
            "response": response.text[:200] if response.text else "",
            "headers": dict(response.headers)
        }
    except Exception as e:
        return {
            "status_code": "ERROR",
            "response": str(e),
            "headers": {}
        }

def main():
    """Main test function."""
    print("Testing Dashboard Authentication")
    print("=" * 50)
    
    # Test problematic endpoints
    test_cases = [
        ("/api/vendor/profile", "vendor", "GET"),
        ("/api/vendor/dashboard/stats", "vendor", "GET"),
        ("/api/vendor/assigned-packages", "vendor", "GET"),
        ("/api/ngo/profile", "ngo", "GET"),
        ("/api/ngo/dashboard/stats", "ngo", "GET"),
        ("/api/ngo/gallery", "ngo", "GET"),
    ]
    
    print("\n1. Testing with manually created tokens:")
    print("-" * 40)
    
    for endpoint, user_type, method in test_cases:
        result = test_endpoint_with_auth(endpoint, user_type, method)
        status_icon = "✅" if str(result["status_code"]).startswith("2") else "❌"
        print(f"{status_icon} {endpoint} ({user_type}): {result['status_code']}")
        if result["status_code"] not in [200, 201]:
            print(f"   Response: {result['response'][:100]}")
    
    print("\n2. Testing with real login tokens:")
    print("-" * 40)
    
    for endpoint, user_type, method in test_cases:
        result = test_with_real_token(endpoint, user_type, method)
        status_icon = "✅" if str(result["status_code"]).startswith("2") else "❌"
        print(f"{status_icon} {endpoint} ({user_type}): {result['status_code']}")
        if result["status_code"] not in [200, 201]:
            print(f"   Response: {result['response'][:100]}")
    
    print("\n3. Testing login endpoints:")
    print("-" * 40)
    
    for user_type in ["admin", "vendor", "ngo"]:
        token = test_login_endpoint(user_type)
        status = "✅ Success" if token else "❌ Failed"
        print(f"{status} Login for {user_type}")
        if token:
            print(f"   Token: {token[:50]}...")

if __name__ == "__main__":
    main()