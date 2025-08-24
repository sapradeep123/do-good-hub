#!/usr/bin/env python3
"""
Debug script to check vendor data structure
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@dogoodhub.com"
ADMIN_PASSWORD = "password"

def debug_vendor_fields():
    print("🔍 Debugging Vendor Data Structure")
    print("=" * 40)
    
    # Login as admin
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
            return
            
        login_result = response.json()
        token = login_result['data']['access_token']
        print("✅ Admin authentication successful")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Get vendors list and show structure
    print("\n2. Fetching vendors and showing data structure...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/admin/vendors", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch vendors: {response.status_code} - {response.text}")
            return
            
        vendors = response.json()
        print(f"✅ Found {len(vendors)} vendors")
        
        if vendors:
            print("\n📋 First vendor data structure:")
            vendor = vendors[0]
            print(json.dumps(vendor, indent=2, default=str))
            
            print("\n🔑 Available fields:")
            for key in vendor.keys():
                print(f"  - {key}: {type(vendor[key]).__name__}")
        else:
            print("❌ No vendors found")
            
    except Exception as e:
        print(f"❌ Error fetching vendors: {e}")

if __name__ == "__main__":
    debug_vendor_fields()