import asyncio
import aiohttp
import json
from typing import Dict, Any

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Test credentials for different user types
TEST_CREDENTIALS = {
    "admin": {
        "email": "admin@dogoodhub.com",
        "password": "password"
    },
    "user": {
        "email": "testuser@example.com",
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

# API endpoints to test for each user type
API_ENDPOINTS = {
    "auth": [
        {"method": "POST", "path": "/api/auth/login", "requires_auth": False},
        {"method": "POST", "path": "/api/auth/register", "requires_auth": False},
        {"method": "GET", "path": "/api/auth/me", "requires_auth": True}
    ],
    "admin": [
        {"method": "GET", "path": "/api/admin/ngos", "requires_auth": True},
        {"method": "GET", "path": "/api/admin/vendors", "requires_auth": True},
        {"method": "GET", "path": "/api/admin/users", "requires_auth": True},
        {"method": "GET", "path": "/api/admin/packages", "requires_auth": True},
        {"method": "GET", "path": "/api/admin/donations", "requires_auth": True}
    ],
    "ngos": [
        {"method": "GET", "path": "/api/ngos", "requires_auth": False},
        {"method": "POST", "path": "/api/ngos", "requires_auth": True}
    ],
    "vendors": [
        {"method": "GET", "path": "/api/vendors", "requires_auth": False},
        {"method": "POST", "path": "/api/vendors", "requires_auth": True}
    ],
    "packages": [
        {"method": "GET", "path": "/api/packages", "requires_auth": False},
        {"method": "POST", "path": "/api/packages", "requires_auth": True}
    ],
    "donations": [
        {"method": "GET", "path": "/api/donations", "requires_auth": True},
        {"method": "POST", "path": "/api/donations", "requires_auth": True}
    ]
}

class APITester:
    def __init__(self):
        self.session = None
        self.tokens = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self, user_type: str) -> str:
        """Login and get JWT token for user type"""
        if user_type in self.tokens:
            return self.tokens[user_type]
            
        credentials = TEST_CREDENTIALS.get(user_type)
        if not credentials:
            return None
            
        try:
            async with self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=credentials
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get("access_token")
                    if token:
                        self.tokens[user_type] = token
                        return token
                else:
                    print(f"❌ Login failed for {user_type}: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Login error for {user_type}: {e}")
            return None
    
    async def test_endpoint(self, method: str, path: str, requires_auth: bool = False, user_type: str = "admin") -> Dict[str, Any]:
        """Test a single API endpoint"""
        headers = {}
        
        if requires_auth:
            token = await self.login(user_type)
            if not token:
                return {
                    "status": "FAILED",
                    "error": f"Could not authenticate as {user_type}"
                }
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            url = f"{BASE_URL}{path}"
            
            if method == "GET":
                async with self.session.get(url, headers=headers) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            elif method == "POST":
                # Use minimal test data for POST requests
                test_data = {}
                async with self.session.post(url, headers=headers, json=test_data) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            else:
                return {"status": "SKIPPED", "error": f"Method {method} not implemented"}
            
            return {
                "status": "SUCCESS" if status < 500 else "FAILED",
                "status_code": status,
                "response_size": len(str(data)) if data else 0
            }
            
        except Exception as e:
            return {
                "status": "ERROR",
                "error": str(e)
            }
    
    async def test_all_endpoints(self):
        """Test all API endpoints"""
        print("=== API ENDPOINT TESTING ===")
        print(f"Base URL: {BASE_URL}")
        print()
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category, endpoints in API_ENDPOINTS.items():
            print(f"\n📁 {category.upper()} ENDPOINTS:")
            
            for endpoint in endpoints:
                method = endpoint["method"]
                path = endpoint["path"]
                requires_auth = endpoint["requires_auth"]
                
                # Determine user type for auth
                user_type = "admin"
                if "admin" in path:
                    user_type = "admin"
                elif "vendor" in path:
                    user_type = "vendor"
                elif "ngo" in path:
                    user_type = "ngo"
                
                result = await self.test_endpoint(method, path, requires_auth, user_type)
                total_tests += 1
                
                status_icon = "✅" if result["status"] == "SUCCESS" else "❌"
                if result["status"] == "SUCCESS":
                    passed_tests += 1
                else:
                    failed_tests += 1
                
                auth_info = f" (auth: {user_type})" if requires_auth else " (public)"
                print(f"  {status_icon} {method} {path}{auth_info}")
                
                if result["status"] != "SUCCESS":
                    if "status_code" in result:
                        print(f"      Status: {result['status_code']}")
                    if "error" in result:
                        print(f"      Error: {result['error']}")
        
        print(f"\n=== TEST SUMMARY ===")
        print(f"Total tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests
        }

async def main():
    """Main test function"""
    async with APITester() as tester:
        await tester.test_all_endpoints()

if __name__ == "__main__":
    asyncio.run(main())