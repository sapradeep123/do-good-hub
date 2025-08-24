import asyncio
import httpx
import json
from typing import Dict, Any

async def test_dashboard_endpoints():
    """Test dashboard endpoints to investigate 404 vs 401 authentication issues"""
    
    base_url = "http://localhost:8000"
    
    # Test endpoints that should exist
    dashboard_endpoints = [
        # Vendor dashboard endpoints
        "/api/vendor/dashboard",
        "/api/vendor/profile",
        "/api/vendor/orders",
        "/api/vendor/analytics",
        
        # NGO dashboard endpoints
        "/api/ngo/dashboard",
        "/api/ngo/profile",
        "/api/ngo/packages",
        "/api/ngo/donations",
        "/api/ngo/analytics",
        
        # Admin dashboard endpoints
        "/api/admin/dashboard",
        "/api/admin/users",
        "/api/admin/ngos",
        "/api/admin/vendors",
        "/api/admin/analytics",
        
        # User dashboard endpoints
        "/api/user/dashboard",
        "/api/user/profile",
        "/api/user/donations",
    ]
    
    print("\n" + "=" * 80)
    print("🔍 DASHBOARD ENDPOINTS INVESTIGATION")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("\n📋 Testing endpoint accessibility (without authentication)")
        print("-" * 60)
        
        results = {}
        
        for endpoint in dashboard_endpoints:
            try:
                response = await client.get(f"{base_url}{endpoint}")
                status_code = response.status_code
                
                # Analyze the response
                if status_code == 404:
                    status_emoji = "❌"
                    issue = "ENDPOINT NOT FOUND"
                elif status_code == 401:
                    status_emoji = "✅"
                    issue = "AUTHENTICATION REQUIRED (EXPECTED)"
                elif status_code == 403:
                    status_emoji = "⚠️"
                    issue = "FORBIDDEN"
                elif status_code == 422:
                    status_emoji = "⚠️"
                    issue = "VALIDATION ERROR"
                elif status_code == 500:
                    status_emoji = "🔥"
                    issue = "SERVER ERROR"
                else:
                    status_emoji = "❓"
                    issue = f"UNEXPECTED STATUS: {status_code}"
                
                print(f"{status_emoji} {endpoint:<30} [{status_code}] {issue}")
                results[endpoint] = {
                    "status_code": status_code,
                    "issue": issue,
                    "response_text": response.text[:200] if response.text else ""
                }
                
            except httpx.ConnectError:
                print(f"🔌 {endpoint:<30} [---] SERVER NOT RUNNING")
                results[endpoint] = {"status_code": None, "issue": "SERVER NOT RUNNING"}
            except Exception as e:
                print(f"💥 {endpoint:<30} [ERR] {str(e)[:50]}")
                results[endpoint] = {"status_code": None, "issue": str(e)}
        
        # Analyze results
        print("\n" + "=" * 80)
        print("📊 ANALYSIS SUMMARY")
        print("=" * 80)
        
        not_found_endpoints = [ep for ep, result in results.items() if result.get("status_code") == 404]
        auth_required_endpoints = [ep for ep, result in results.items() if result.get("status_code") == 401]
        server_error_endpoints = [ep for ep, result in results.items() if result.get("status_code") == 500]
        other_endpoints = [ep for ep, result in results.items() if result.get("status_code") not in [404, 401, 500, None]]
        
        print(f"\n❌ ENDPOINTS NOT FOUND (404): {len(not_found_endpoints)}")
        for ep in not_found_endpoints:
            print(f"   • {ep}")
        
        print(f"\n✅ ENDPOINTS REQUIRING AUTH (401): {len(auth_required_endpoints)}")
        for ep in auth_required_endpoints:
            print(f"   • {ep}")
        
        if server_error_endpoints:
            print(f"\n🔥 ENDPOINTS WITH SERVER ERRORS (500): {len(server_error_endpoints)}")
            for ep in server_error_endpoints:
                print(f"   • {ep}")
        
        if other_endpoints:
            print(f"\n❓ ENDPOINTS WITH OTHER STATUS: {len(other_endpoints)}")
            for ep in other_endpoints:
                status = results[ep].get("status_code")
                print(f"   • {ep} [{status}]")
        
        # Check if server is running
        try:
            health_response = await client.get(f"{base_url}/health")
            print(f"\n🏥 Server Health Check: [{health_response.status_code}] {health_response.text[:100]}")
        except:
            print("\n🔌 Server appears to be offline")
        
        # Recommendations
        print("\n" + "=" * 80)
        print("💡 RECOMMENDATIONS")
        print("=" * 80)
        
        if not_found_endpoints:
            print("\n🔧 ROUTE REGISTRATION ISSUES:")
            print("   • Check if routes are properly registered in FastAPI app")
            print("   • Verify route prefixes and path patterns")
            print("   • Ensure route modules are imported in main.py")
        
        if len(auth_required_endpoints) > len(not_found_endpoints):
            print("\n✅ AUTHENTICATION WORKING:")
            print("   • Most endpoints properly return 401 for unauthenticated requests")
            print("   • Focus on fixing the 404 endpoints")
        
        if server_error_endpoints:
            print("\n🔥 SERVER ERRORS NEED ATTENTION:")
            print("   • Check server logs for detailed error information")
            print("   • Verify database connections and dependencies")
        
        print("\n" + "=" * 80)
        
        return results

if __name__ == "__main__":
    asyncio.run(test_dashboard_endpoints())