#!/usr/bin/env python3
"""
Comprehensive API Connection Test
Tests all available endpoints with correct paths and methods
"""

import asyncio
import httpx
import json
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"

# Test credentials
ADMIN_CREDENTIALS = {
    "email": "admin@dogoodhub.com",
    "password": "password"
}

class APITester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=10.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def login_admin(self) -> Optional[str]:
        """Login as admin and return token"""
        try:
            response = await self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=ADMIN_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                # Token is nested under 'data' key
                token_data = data.get("data", {})
                self.admin_token = token_data.get("access_token")
                return self.admin_token
        except Exception as e:
            print(f"Admin login failed: {e}")
        return None
    
    async def test_endpoint(self, method: str, path: str, requires_auth: bool = False, 
                          data: Optional[Dict] = None) -> Dict[str, Any]:
        """Test a single endpoint"""
        headers = {}
        
        if requires_auth:
            if not self.admin_token:
                await self.login_admin()
            if self.admin_token:
                headers["Authorization"] = f"Bearer {self.admin_token}"
            else:
                return {"status": "FAILED", "error": "Authentication failed"}
        
        try:
            url = f"{BASE_URL}{path}"
            
            if method == "GET":
                response = await self.session.get(url, headers=headers)
            elif method == "POST":
                response = await self.session.post(url, headers=headers, json=data or {})
            elif method == "PUT":
                response = await self.session.put(url, headers=headers, json=data or {})
            elif method == "DELETE":
                response = await self.session.delete(url, headers=headers)
            else:
                return {"status": "SKIPPED", "error": f"Method {method} not supported"}
            
            return {
                "status": "SUCCESS" if 200 <= response.status_code < 300 else "FAILED",
                "status_code": response.status_code,
                "response": response.text[:200] if response.text else "No content"
            }
            
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}
    
    async def run_comprehensive_test(self):
        """Run comprehensive API tests"""
        print("=" * 80)
        print("🔍 COMPREHENSIVE API CONNECTION TEST")
        print("=" * 80)
        
        # Test categories with correct endpoints
        test_categories = {
            "🏥 Health & Basic": [
                {"method": "GET", "path": "/health", "auth": False, "desc": "Health Check"},
                {"method": "GET", "path": "/docs", "auth": False, "desc": "API Documentation"},
                {"method": "OPTIONS", "path": "/api/auth/login", "auth": False, "desc": "CORS Preflight"},
            ],
            
            "🔐 Authentication": [
                {"method": "POST", "path": "/api/auth/login", "auth": False, "desc": "Admin Login", 
                 "data": ADMIN_CREDENTIALS},
                {"method": "POST", "path": "/api/auth/register", "auth": False, "desc": "User Registration",
                 "data": {"email": "test@example.com", "password": "password", "first_name": "Test", "last_name": "User"}},
                {"method": "GET", "path": "/api/auth/me", "auth": True, "desc": "Current User Info"},
            ],
            
            "👥 User Management": [
                {"method": "GET", "path": "/api/users", "auth": True, "desc": "List All Users (Admin)"},
            ],
            
            "🏢 NGO Management": [
                {"method": "GET", "path": "/api/ngos/", "auth": False, "desc": "List All NGOs (Public)"},
                {"method": "POST", "path": "/api/ngos/", "auth": True, "desc": "Create NGO",
                 "data": {
                     "name": "Test NGO API",
                     "description": "Test NGO Description",
                     "started_date": "2020-01-01T00:00:00",
                     "total_members": 10,
                     "full_address": "123 Test Street",
                     "pin_code": "123456",
                     "city": "Test City",
                     "state": "Test State",
                     "country": "India",
                     "phone": "+91-9876543210",
                     "email": "testapi@ngo.com"
                 }},
                {"method": "GET", "path": "/api/admin/ngos", "auth": True, "desc": "Admin NGO List"},
            ],
            
            "🏪 Vendor Management": [
                {"method": "GET", "path": "/api/vendors/", "auth": False, "desc": "List All Vendors (Public)"},
                {"method": "POST", "path": "/api/vendors/", "auth": True, "desc": "Create Vendor",
                 "data": {
                     "shop_name": "Test Vendor Shop",
                     "owner_name": "Test Owner",
                     "shop_location": "Test Location",
                     "full_address": "456 Vendor Street",
                     "pin_code": "654321",
                     "city": "Vendor City",
                     "state": "Vendor State",
                     "country": "India",
                     "phone": "+91-9876543211",
                     "email": "testapi@vendor.com",
                     "gst_number": "22AAAAA0000A1Z5",
                     "business_type": "Retail"
                 }},
                {"method": "GET", "path": "/api/admin/vendors", "auth": True, "desc": "Admin Vendor List"},
            ],
            
            "📦 Package Management": [
                {"method": "GET", "path": "/api/packages/", "auth": False, "desc": "List All Packages (Public)"},
            ],
            
            "💰 Donation Management": [
                {"method": "GET", "path": "/api/donations", "auth": True, "desc": "List Donations"},
            ],
            
            "⚙️ Admin Settings": [
                {"method": "GET", "path": "/api/admin/settings", "auth": True, "desc": "Application Settings"},
                {"method": "GET", "path": "/api/admin/donation-packages", "auth": True, "desc": "Admin Donation Packages"},
            ]
        }
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category, tests in test_categories.items():
            print(f"\n{category}")
            print("-" * 60)
            
            for test in tests:
                result = await self.test_endpoint(
                    test["method"], 
                    test["path"], 
                    test.get("auth", False),
                    test.get("data")
                )
                
                total_tests += 1
                status_icon = "✅" if result["status"] == "SUCCESS" else "❌"
                
                if result["status"] == "SUCCESS":
                    passed_tests += 1
                else:
                    failed_tests += 1
                
                auth_info = " (🔐)" if test.get("auth") else " (🌐)"
                print(f"{status_icon} {test['desc']}{auth_info}: [{result.get('status_code', 'N/A')}]")
                
                if result["status"] != "SUCCESS":
                    error_msg = result.get("error", result.get("response", "Unknown error"))
                    print(f"   └─ {error_msg[:100]}")
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("\n🎉 API connections are working well!")
        elif success_rate >= 60:
            print("\n⚠️  Most API connections are working, some issues need attention.")
        else:
            print("\n🚨 Significant API connection issues detected.")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": success_rate
        }

async def main():
    """Main test function"""
    async with APITester() as tester:
        results = await tester.run_comprehensive_test()
        return results

if __name__ == "__main__":
    asyncio.run(main())