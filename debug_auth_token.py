#!/usr/bin/env python3
"""
Debug authentication token issues
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

ADMIN_CREDENTIALS = {
    "email": "admin@dogoodhub.com",
    "password": "password"
}

async def debug_auth():
    """Debug authentication flow"""
    print("=== DEBUGGING AUTHENTICATION ===")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test login
        print("\n1. Testing admin login...")
        try:
            response = await client.post(
                f"{BASE_URL}/api/auth/login",
                json=ADMIN_CREDENTIALS
            )
            print(f"Login Status: {response.status_code}")
            print(f"Login Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                login_data = response.json()
                print(f"Login Response: {json.dumps(login_data, indent=2)}")
                
                # Extract token
                token = login_data.get("access_token")
                if not token:
                    # Try alternative token field names
                    token = login_data.get("token") or login_data.get("authToken")
                
                if token:
                    print(f"\n2. Token found: {token[:50]}...")
                    
                    # Test protected endpoint
                    print("\n3. Testing protected endpoint with token...")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    me_response = await client.get(
                        f"{BASE_URL}/api/auth/me",
                        headers=headers
                    )
                    print(f"Me endpoint status: {me_response.status_code}")
                    print(f"Me endpoint response: {me_response.text[:200]}")
                    
                    # Test admin endpoint
                    print("\n4. Testing admin endpoint...")
                    admin_response = await client.get(
                        f"{BASE_URL}/api/users",
                        headers=headers
                    )
                    print(f"Admin users status: {admin_response.status_code}")
                    print(f"Admin users response: {admin_response.text[:200]}")
                    
                else:
                    print("❌ No token found in login response")
            else:
                print(f"❌ Login failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Login error: {e}")
        
        # Test public endpoints with redirects
        print("\n5. Testing public endpoints...")
        public_endpoints = [
            "/api/ngos",
            "/api/vendors", 
            "/api/packages"
        ]
        
        for endpoint in public_endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}")
                print(f"{endpoint}: {response.status_code}")
                if response.status_code == 307:
                    print(f"  Redirect to: {response.headers.get('location', 'Unknown')}")
                elif response.status_code != 200:
                    print(f"  Response: {response.text[:100]}")
            except Exception as e:
                print(f"{endpoint}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(debug_auth())