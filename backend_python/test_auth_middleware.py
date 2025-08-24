#!/usr/bin/env python3
"""
Test authentication middleware to understand why we get 404 instead of 401
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint_with_different_auth(endpoint: str) -> Dict[str, Any]:
    """Test an endpoint with different authentication scenarios."""
    results = {}
    
    # Test 1: No authentication header
    print(f"\n🔍 Testing {endpoint}")
    print("1. No auth header:")
    try:
        response = requests.get(f"{BASE_URL}{endpoint}")
        results['no_auth'] = {
            'status_code': response.status_code,
            'response': response.text[:200] if response.text else 'Empty response'
        }
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}")
    except Exception as e:
        results['no_auth'] = {'error': str(e)}
        print(f"   Error: {e}")
    
    # Test 2: Invalid token
    print("2. Invalid token:")
    headers = {'Authorization': 'Bearer invalid_token_here'}
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        results['invalid_token'] = {
            'status_code': response.status_code,
            'response': response.text[:200] if response.text else 'Empty response'
        }
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}")
    except Exception as e:
        results['invalid_token'] = {'error': str(e)}
        print(f"   Error: {e}")
    
    # Test 3: Malformed token
    print("3. Malformed token:")
    headers = {'Authorization': 'Bearer malformed.token.here'}
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        results['malformed_token'] = {
            'status_code': response.status_code,
            'response': response.text[:200] if response.text else 'Empty response'
        }
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}")
    except Exception as e:
        results['malformed_token'] = {'error': str(e)}
        print(f"   Error: {e}")
    
    return results

def main():
    print("=== AUTHENTICATION MIDDLEWARE TEST ===")
    
    # Test server health first
    print("\n🏥 Server Health Check:")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {response.text}")
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return
    
    # Test problematic endpoints
    problematic_endpoints = [
        "/api/vendor/profile",
        "/api/vendor/dashboard/stats", 
        "/api/ngo/profile",
        "/api/ngo/dashboard/stats",
        "/api/admin/settings"
    ]
    
    all_results = {}
    
    for endpoint in problematic_endpoints:
        all_results[endpoint] = test_endpoint_with_different_auth(endpoint)
    
    # Summary
    print("\n\n=== SUMMARY ===")
    for endpoint, results in all_results.items():
        print(f"\n{endpoint}:")
        for test_type, result in results.items():
            if 'error' in result:
                print(f"  {test_type}: ERROR - {result['error']}")
            else:
                status = result['status_code']
                print(f"  {test_type}: {status} - {'✅' if status in [401, 403] else '❌' if status == 404 else '⚠️'}")
    
    # Check if authentication middleware is working
    print("\n=== ANALYSIS ===")
    auth_working = False
    for endpoint, results in all_results.items():
        for test_type, result in results.items():
            if 'status_code' in result and result['status_code'] in [401, 403]:
                auth_working = True
                break
        if auth_working:
            break
    
    if auth_working:
        print("✅ Authentication middleware is working (found 401/403 responses)")
        print("❓ 404 errors might be due to route path issues or middleware ordering")
    else:
        print("❌ Authentication middleware might not be working properly")
        print("🔧 All endpoints returning 404 suggests route registration or middleware issues")

if __name__ == "__main__":
    main()