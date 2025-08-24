#!/usr/bin/env python3
"""
Simple test to verify vendor edit functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@dogoodhub.com"
ADMIN_PASSWORD = "password"

def test_vendor_edit():
    print("🚀 Testing Vendor Edit Functionality")
    print("=" * 40)
    
    # Step 1: Login as admin
    print("\n1. Authenticating as admin...")
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
            
        login_result = response.json()
        if not login_result.get('success'):
            print(f"❌ Login unsuccessful: {login_result}")
            return False
            
        token = login_result['data']['access_token']
        print("✅ Admin authentication successful")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get vendors list
    print("\n2. Fetching vendors list...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/admin/vendors", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch vendors: {response.status_code} - {response.text}")
            return False
            
        vendors = response.json()
        if not vendors:
            print("❌ No vendors found")
            return False
            
        vendor = vendors[0]
        vendor_id = vendor['id']
        original_name = vendor.get('shop_name', 'Unknown')
        print(f"✅ Found vendor: {original_name} (ID: {vendor_id})")
        
    except Exception as e:
        print(f"❌ Error fetching vendors: {e}")
        return False
    
    # Step 3: Update vendor
    print("\n3. Updating vendor data...")
    # Update vendor data (using API field names from VendorUpdate schema)
    update_data = {
        "shop_name": "Updated Test Company",
        "description": "Updated description for testing",
        "full_address": "Updated Test Address 123",
        "phone": "9876543210"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}",
            json=update_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Vendor update failed: {response.status_code} - {response.text}")
            return False
            
        update_result = response.json()
        if not update_result.get('success'):
            print(f"❌ Update unsuccessful: {update_result}")
            return False
            
        print("✅ Vendor update request successful")
        
    except Exception as e:
        print(f"❌ Error updating vendor: {e}")
        return False
    
    # Step 4: Verify update
    print("\n4. Verifying data persistence...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/vendors", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch updated vendors: {response.status_code}")
            return False
            
        updated_vendors = response.json()
        updated_vendor = next((v for v in updated_vendors if v['id'] == vendor_id), None)
        
        if not updated_vendor:
            print("❌ Updated vendor not found")
            return False
            
        # Check if the update was successful
        if (updated_vendor['shop_name'] == update_data['shop_name'] and 
            updated_vendor['description'] == update_data['description'] and
            updated_vendor['phone'] == update_data['phone']):
            print("✅ Data persistence verified:")
            print(f"   - Shop name: {updated_vendor['shop_name']}")
            print(f"   - Description: {updated_vendor['description']}")
            print(f"   - Phone: {updated_vendor['phone']}")
            return True
        else:
            print("❌ Data not persisted correctly:")
            print(f"   Expected shop_name: {update_data['shop_name']}")
            print(f"   Actual shop_name: {updated_vendor['shop_name']}")
            print(f"   Expected description: {update_data['description']}")
            print(f"   Actual description: {updated_vendor['description']}")
            print(f"   Expected phone: {update_data['phone']}")
            print(f"   Actual phone: {updated_vendor['phone']}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying update: {e}")
        return False

if __name__ == "__main__":
    success = test_vendor_edit()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 VENDOR EDIT TEST PASSED!")
        print("✅ Data persistence issue has been resolved.")
    else:
        print("❌ VENDOR EDIT TEST FAILED!")
        print("⚠️  Data persistence issue may still exist.")
    print("=" * 40)