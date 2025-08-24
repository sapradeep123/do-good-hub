#!/usr/bin/env python3
"""
Test script to investigate authentication behavior for dashboard endpoints.
This will help understand why 404 errors are returned instead of 401.
"""

import requests
import json
from typing import Dict, Any

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_endpoint_with_invalid_auth(endpoint: str, method: str = "GET") -> Dict[str, Any]:
    """Test an endpoint with invalid authentication."""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": "Bearer invalid_token_here",
        "Content-Type": "application/json"
    }
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json={}, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json={}, timeout=10)
        else:
            response = requests.get(url, headers=headers, timeout=10)
            
        return {
            "endpoint": endpoint,
            "method": method,
            "status_code": response.status_code,
            "response_text": response.text[:500],  # Limit response text
            "headers": dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {
            "endpoint": endpoint,
            "method": method,
            "error": str(e),
            "status_code": None
        }

def test_endpoint_without_auth(endpoint: str, method: str = "GET") -> Dict[str, Any]:
    """Test an endpoint without any authentication."""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json={}, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json={}, timeout=10)
        else:
            response = requests.get(url, timeout=10)
            
        return {
            "endpoint": endpoint,
            "method": method,
            "status_code": response.status_code,
            "response_text": response.text[:500],  # Limit response text
            "headers": dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {
            "endpoint": endpoint,
            "method": method,
            "error": str(e),
            "status_code": None
        }

def main():
    """Test authentication behavior for problematic endpoints."""
    print("Testing Authentication Behavior for Dashboard Endpoints")
    print("=" * 60)
    
    # Test endpoints that were returning 404
    problematic_endpoints = [
        "/api/vendor/profile",
        "/api/vendor/dashboard/stats",
        "/api/vendor/assigned-packages",
        "/api/ngo/profile",
        "/api/ngo/dashboard/stats"
    ]
    
    print("\n1. Testing with INVALID authentication token:")
    print("-" * 50)
    for endpoint in problematic_endpoints:
        result = test_endpoint_with_invalid_auth(endpoint)
        print(f"Endpoint: {result['endpoint']}")
        print(f"Status: {result.get('status_code', 'ERROR')}")
        if 'error' in result:
            print(f"Error: {result['error']}")
        else:
            print(f"Response: {result['response_text'][:200]}...")
        print()
    
    print("\n2. Testing WITHOUT authentication token:")
    print("-" * 50)
    for endpoint in problematic_endpoints:
        result = test_endpoint_without_auth(endpoint)
        print(f"Endpoint: {result['endpoint']}")
        print(f"Status: {result.get('status_code', 'ERROR')}")
        if 'error' in result:
            print(f"Error: {result['error']}")
        else:
            print(f"Response: {result['response_text'][:200]}...")
        print()
    
    print("\n3. Testing a known working endpoint for comparison:")
    print("-" * 50)
    working_endpoints = ["/api/packages", "/api/ngos", "/api/vendors"]
    for endpoint in working_endpoints:
        result = test_endpoint_without_auth(endpoint)
        print(f"Endpoint: {result['endpoint']}")
        print(f"Status: {result.get('status_code', 'ERROR')}")
        if 'error' in result:
            print(f"Error: {result['error']}")
        else:
            print(f"Response: {result['response_text'][:100]}...")
        print()

if __name__ == "__main__":
    main()