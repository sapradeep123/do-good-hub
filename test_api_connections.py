#!/usr/bin/env python3
"""
Comprehensive API Connection Test
Tests all major API endpoints with proper authentication
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8080"

# Working credentials from previous test
ADMIN_CREDENTIALS = {"email": "admin@dogoodhub.com", "password": "password"}

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {e}")
            return False
            
    def test_cors_preflight(self):
        """Test CORS preflight request"""
        try:
            headers = {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            response = self.session.options(f"{BASE_URL}/api/auth/login", headers=headers)
            success = response.status_code in [200, 204]
            details = f"Status: {response.status_code}"
            if success:
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                }
                details += f", CORS Headers: {cors_headers}"
            self.log_test("CORS Preflight", success, details)
            return success
        except Exception as e:
            self.log_test("CORS Preflight", False, f"Exception: {e}")
            return False
            
    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        try:
            response = self.session.get(FRONTEND_URL)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                details += f", Content-Type: {response.headers.get('content-type', 'N/A')}"
            self.log_test("Frontend Accessibility", success, details)
            return success
        except Exception as e:
            self.log_test("Frontend Accessibility", False, f"Exception: {e}")
            return False
            
    def authenticate_admin(self):
        """Authenticate as admin and store token"""
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDENTIALS)
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and 'access_token' in data['data']:
                    self.admin_token = data['data']['access_token']
                    self.log_test("Admin Authentication", True, "Token obtained successfully")
                    return True
                else:
                    self.log_test("Admin Authentication", False, "No access token in response")
                    return False
            else:
                error_data = response.json() if response.content else {}
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Error: {error_data.get('message', 'Unknown')}")
                return False
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {e}")
            return False
            
    def test_user_registration_login(self):
        """Test user registration and login"""
        test_user = {
            "email": f"test_api_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "testpass123",
            "full_name": "API Test User",
            "user_type": "individual"
        }
        
        # Test registration
        try:
            reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json=test_user)
            if reg_response.status_code in [200, 201]:
                # Test login
                login_data = {"email": test_user['email'], "password": test_user['password']}
                login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
                
                if login_response.status_code == 200:
                    data = login_response.json()
                    if 'data' in data and 'access_token' in data['data']:
                        self.user_token = data['data']['access_token']
                        self.log_test("User Registration & Login", True, f"User: {test_user['email']}")
                        return True
                    else:
                        self.log_test("User Registration & Login", False, "No access token in login response")
                        return False
                else:
                    error_data = login_response.json() if login_response.content else {}
                    self.log_test("User Registration & Login", False, f"Login failed: {error_data.get('message', 'Unknown')}")
                    return False
            else:
                error_data = reg_response.json() if reg_response.content else {}
                self.log_test("User Registration & Login", False, f"Registration failed: {error_data.get('message', 'Unknown')}")
                return False
        except Exception as e:
            self.log_test("User Registration & Login", False, f"Exception: {e}")
            return False
            
    def test_protected_endpoint(self, token, endpoint, test_name):
        """Test a protected endpoint with authentication"""
        if not token:
            self.log_test(test_name, False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{BASE_URL}{endpoint}", headers=headers)
            success = response.status_code == 200
            
            if success:
                try:
                    data = response.json()
                    details = f"Status: {response.status_code}, Data keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}"
                except:
                    details = f"Status: {response.status_code}, Response length: {len(response.content)}"
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data.get('message', 'Unknown')}"
                except:
                    details = f"Status: {response.status_code}, Raw error: {response.text[:100]}"
                    
            self.log_test(test_name, success, details)
            return success
        except Exception as e:
            self.log_test(test_name, False, f"Exception: {e}")
            return False
            
    def test_public_endpoint(self, endpoint, test_name):
        """Test a public endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            success = response.status_code == 200
            
            if success:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        details = f"Status: {response.status_code}, Items count: {len(data)}"
                    elif isinstance(data, dict):
                        details = f"Status: {response.status_code}, Data keys: {list(data.keys())}"
                    else:
                        details = f"Status: {response.status_code}, Response type: {type(data)}"
                except:
                    details = f"Status: {response.status_code}, Response length: {len(response.content)}"
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data.get('message', 'Unknown')}"
                except:
                    details = f"Status: {response.status_code}, Raw error: {response.text[:100]}"
                    
            self.log_test(test_name, success, details)
            return success
        except Exception as e:
            self.log_test(test_name, False, f"Exception: {e}")
            return False
            
    def test_post_endpoint(self, endpoint, data, test_name, token=None):
        """Test a POST endpoint"""
        try:
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
                
            response = self.session.post(f"{BASE_URL}{endpoint}", json=data, headers=headers)
            success = response.status_code in [200, 201]
            
            if success:
                try:
                    resp_data = response.json()
                    details = f"Status: {response.status_code}, Created/Updated successfully"
                except:
                    details = f"Status: {response.status_code}, Response length: {len(response.content)}"
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data.get('message', 'Unknown')}"
                except:
                    details = f"Status: {response.status_code}, Raw error: {response.text[:100]}"
                    
            self.log_test(test_name, success, details)
            return success
        except Exception as e:
            self.log_test(test_name, False, f"Exception: {e}")
            return False
            
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Comprehensive API Connection Test")
        print(f"Backend: {BASE_URL}")
        print(f"Frontend: {FRONTEND_URL}")
        print("=" * 50)
        
        # Basic connectivity tests
        print("\n📡 Basic Connectivity Tests")
        self.test_health_check()
        self.test_cors_preflight()
        self.test_frontend_accessibility()
        
        # Authentication tests
        print("\n🔐 Authentication Tests")
        admin_auth_success = self.authenticate_admin()
        user_auth_success = self.test_user_registration_login()
        
        # Protected endpoint tests
        print("\n🔒 Protected Endpoint Tests")
        self.test_protected_endpoint(self.admin_token, "/api/auth/me", "Admin Profile Access")
        self.test_protected_endpoint(self.user_token, "/api/auth/me", "User Profile Access")
        
        # Public endpoint tests
        print("\n🌐 Public Endpoint Tests")
        self.test_public_endpoint("/api/ngos", "NGO Listing")
        self.test_public_endpoint("/api/vendors", "Vendor Listing")
        
        # Admin endpoint tests
        print("\n👑 Admin Endpoint Tests")
        self.test_protected_endpoint(self.admin_token, "/api/admin/ngos", "Admin NGO Management")
        self.test_protected_endpoint(self.admin_token, "/api/admin/vendors", "Admin Vendor Management")
        self.test_protected_endpoint(self.admin_token, "/api/admin/users", "Admin User Management")
        
        # Test NGO creation (if admin token available)
        if self.admin_token:
            print("\n🏢 NGO Management Tests")
            test_ngo_data = {
                "name": "Test NGO API Connection",
                "description": "Test NGO for API connection testing",
                "mission": "Testing API connections",
                "website": "https://test-ngo.example.com",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "country": "Test Country",
                "phone": "+1234567890",
                "email": "test@testngo.com",
                "registration_number": "TEST123"
            }
            self.test_post_endpoint("/api/admin/ngos", test_ngo_data, "NGO Creation", self.admin_token)
            
        # Test Vendor creation (if admin token available)
        if self.admin_token:
            print("\n🏪 Vendor Management Tests")
            test_vendor_data = {
                "name": "Test Vendor API Connection",
                "description": "Test vendor for API connection testing",
                "category": "Technology",
                "website": "https://test-vendor.example.com",
                "address": "456 Vendor Street",
                "city": "Vendor City",
                "state": "Vendor State",
                "country": "Vendor Country",
                "phone": "+1234567891",
                "email": "test@testvendor.com",
                "registration_number": "VENDOR123"
            }
            self.test_post_endpoint("/api/admin/vendors", test_vendor_data, "Vendor Creation", self.admin_token)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🎉 API Connection Test Complete!")
        return passed, total

def main():
    tester = APITester()
    passed, total = tester.run_all_tests()
    
    if passed == total:
        print("\n✅ All API connections are working perfectly!")
    elif passed > total * 0.8:
        print("\n⚠️  Most API connections are working, but some issues detected.")
    else:
        print("\n❌ Significant API connection issues detected.")

if __name__ == "__main__":
    main()