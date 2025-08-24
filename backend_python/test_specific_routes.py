import requests
import json

# Test specific routes that should exist
BASE_URL = "http://localhost:8000"

# First, let's get a real token
login_data = {
    "email": "vendor1@example.com",
    "password": "password123"
}

print("=== Getting vendor token ===")
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
print(f"Login status: {response.status_code}")
print(f"Login response: {response.text}")

if response.status_code == 200:
    token_data = response.json()
    if token_data.get('success') and 'data' in token_data:
        token = token_data['data']['access_token']
        print(f"Token obtained: {token[:50]}...")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test the specific routes
        test_routes = [
            "/api/vendor/profile",
            "/api/vendor/dashboard/stats",
            "/api/vendor/assigned-packages"
        ]
        
        print("\n=== Testing vendor routes ===")
        for route in test_routes:
            print(f"\nTesting {route}:")
            try:
                response = requests.get(f"{BASE_URL}{route}", headers=headers)
                print(f"  Status: {response.status_code}")
                print(f"  Response: {response.text[:200]}...")
            except Exception as e:
                print(f"  Error: {e}")
    else:
        print("Failed to extract token from response")
else:
    print("Login failed")

# Also test a route that should definitely exist
print("\n=== Testing known working route ===")
response = requests.get(f"{BASE_URL}/health")
print(f"Health check status: {response.status_code}")
print(f"Health check response: {response.text}")

# Test the docs endpoint to see all routes
print("\n=== Testing docs endpoint ===")
response = requests.get(f"{BASE_URL}/docs")
print(f"Docs status: {response.status_code}")
if response.status_code == 200:
    print("Docs endpoint is accessible")
else:
    print(f"Docs endpoint failed: {response.text[:200]}")