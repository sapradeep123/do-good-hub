#!/usr/bin/env python3
"""
Script to check all registered routes in the FastAPI app
"""

from app.main import app

def check_routes():
    """Check all registered routes in the FastAPI app."""
    print("=== REGISTERED ROUTES ===")
    
    vendor_routes = []
    ngo_routes = []
    auth_routes = []
    other_routes = []
    
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            path = str(route.path)
            methods = list(route.methods) if route.methods else []
            
            if '/vendor' in path:
                vendor_routes.append((path, methods))
            elif '/ngo' in path:
                ngo_routes.append((path, methods))
            elif '/auth' in path:
                auth_routes.append((path, methods))
            else:
                other_routes.append((path, methods))
    
    print("\n📁 VENDOR ROUTES:")
    for path, methods in sorted(vendor_routes):
        print(f"  {', '.join(methods)} {path}")
    
    print("\n📁 NGO ROUTES:")
    for path, methods in sorted(ngo_routes):
        print(f"  {', '.join(methods)} {path}")
    
    print("\n📁 AUTH ROUTES:")
    for path, methods in sorted(auth_routes):
        print(f"  {', '.join(methods)} {path}")
    
    print("\n📁 OTHER ROUTES:")
    for path, methods in sorted(other_routes):
        print(f"  {', '.join(methods)} {path}")
    
    # Check specific problematic routes
    problematic_routes = [
        "/api/vendor/profile",
        "/api/vendor/dashboard/stats", 
        "/api/vendor/assigned-packages",
        "/api/ngo/profile",
        "/api/ngo/dashboard/stats",
        "/api/ngo/gallery"
    ]
    
    print("\n🔍 CHECKING PROBLEMATIC ROUTES:")
    all_paths = [str(route.path) for route in app.routes if hasattr(route, 'path')]
    
    for route_path in problematic_routes:
        if route_path in all_paths:
            print(f"  ✅ {route_path} - FOUND")
        else:
            print(f"  ❌ {route_path} - NOT FOUND")
            # Check for similar routes
            similar = [p for p in all_paths if route_path.split('/')[-1] in p]
            if similar:
                print(f"     Similar routes: {similar}")

if __name__ == "__main__":
    check_routes()