#!/usr/bin/env python3
"""
Test script to verify NGO and Vendor edit functionality in Admin Panel
This script tests the data persistence issue that was reported.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@dogoodhub.com"
ADMIN_PASSWORD = "password"

def get_admin_token():
    """Get admin authentication token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        else:
            print(f"❌ Failed to login as admin: {response.status_code}")
            print(f"Response: {response.text}")
            print(f"Request URL: {BASE_URL}/api/auth/login")
            print(f"Request data: {{'email': '{ADMIN_EMAIL}', 'password': '[HIDDEN]'}}")
            return None
    except Exception as e:
        print(f"❌ Error during admin login: {e}")
        return None

def test_ngo_edit(token):
    """Test NGO edit functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔍 Testing NGO Edit Functionality...")
    
    # First, get list of NGOs
    try:
        response = requests.get(f"{BASE_URL}/api/admin/ngos", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get NGOs: {response.status_code}")
            return False
            
        ngos = response.json()
        if not ngos:
            print("❌ No NGOs found to test edit functionality")
            return False
            
        # Test editing the first NGO
        ngo = ngos[0]
        ngo_id = ngo['id']
        original_name = ngo['name']
        
        print(f"📝 Testing edit for NGO: {original_name} (ID: {ngo_id})")
        
        # Update NGO data
        test_name = f"Updated NGO - {datetime.now().strftime('%H:%M:%S')}"
        update_data = {
            "name": test_name,
            "description": "Updated description for testing",
            "mission": "Updated mission statement",
            "phone": "+1234567890",
            "website": "https://updated-website.com"
        }
        
        # Send PUT request
        response = requests.put(
            f"{BASE_URL}/api/admin/ngos/{ngo_id}",
            headers={**headers, "Content-Type": "application/json"},
            json=update_data
        )
        
        if response.status_code == 200:
            print(f"✅ NGO update request successful")
            
            # Verify the update by fetching the NGO again
            verify_response = requests.get(f"{BASE_URL}/api/admin/ngos/{ngo_id}", headers=headers)
            if verify_response.status_code == 200:
                updated_ngo = verify_response.json()
                if updated_ngo['name'] == test_name:
                    print(f"✅ NGO data persistence verified - Name updated to: {test_name}")
                    return True
                else:
                    print(f"❌ NGO data not persisted - Expected: {test_name}, Got: {updated_ngo['name']}")
                    return False
            else:
                print(f"❌ Failed to verify NGO update: {verify_response.status_code}")
                return False
        else:
            print(f"❌ NGO update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during NGO edit test: {e}")
        return False

def test_vendor_edit(token):
    """Test Vendor edit functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔍 Testing Vendor Edit Functionality...")
    
    # First, get list of Vendors
    try:
        response = requests.get(f"{BASE_URL}/api/admin/vendors", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get Vendors: {response.status_code}")
            return False
            
        vendors = response.json()
        if not vendors:
            print("❌ No Vendors found to test edit functionality")
            return False
            
        # Test editing the first Vendor
        vendor = vendors[0]
        vendor_id = vendor['id']
        original_name = vendor.get('shop_name', vendor.get('company_name', 'Unknown'))
        
        print(f"📝 Testing edit for Vendor: {original_name} (ID: {vendor_id})")
        
        # Update Vendor data
        test_company_name = f"Updated Vendor - {datetime.now().strftime('%H:%M:%S')}"
        update_data = {
            "company_name": test_company_name,
            "contact_person": "Updated Contact Person",
            "phone": "+1987654321",
            "address": "Updated Address for Testing"
        }
        
        # Send PUT request
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}",
            headers={**headers, "Content-Type": "application/json"},
            json=update_data
        )
        
        if response.status_code == 200:
            print(f"✅ Vendor update request successful")
            
            # Verify the update by fetching vendors again
            verify_response = requests.get(f"{BASE_URL}/api/admin/vendors", headers=headers)
            if verify_response.status_code == 200:
                updated_vendors = verify_response.json()
                updated_vendor = next((v for v in updated_vendors if v['id'] == vendor_id), None)
                
                if updated_vendor:
                    vendor_name = updated_vendor.get('shop_name', updated_vendor.get('company_name', 'Unknown'))
                    if test_company_name in vendor_name or vendor_name == test_company_name:
                        print(f"✅ Vendor data persistence verified - Company name updated")
                        return True
                    else:
                        print(f"❌ Vendor data not persisted - Expected: {test_company_name}, Got: {vendor_name}")
                        return False
                else:
                    print(f"❌ Updated vendor not found in list")
                    return False
            else:
                print(f"❌ Failed to verify Vendor update: {verify_response.status_code}")
                return False
        else:
            print(f"❌ Vendor update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during Vendor edit test: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Admin Panel Edit Functionality Test")
    print("=" * 50)
    
    # Get admin token
    print("🔐 Authenticating as admin...")
    token = get_admin_token()
    if not token:
        print("❌ Failed to authenticate as admin. Exiting.")
        sys.exit(1)
    
    print("✅ Admin authentication successful")
    
    # Test NGO edit functionality
    ngo_test_passed = test_ngo_edit(token)
    
    # Test Vendor edit functionality
    vendor_test_passed = test_vendor_edit(token)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"NGO Edit Functionality: {'✅ PASSED' if ngo_test_passed else '❌ FAILED'}")
    print(f"Vendor Edit Functionality: {'✅ PASSED' if vendor_test_passed else '❌ FAILED'}")
    
    if ngo_test_passed and vendor_test_passed:
        print("\n🎉 ALL TESTS PASSED! Data persistence issue has been resolved.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Data persistence issue may still exist.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)