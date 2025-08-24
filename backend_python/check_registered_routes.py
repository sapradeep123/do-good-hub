#!/usr/bin/env python3
"""
Script to check all registered routes in the FastAPI application
"""

import sys
sys.path.append('.')

from app.main import app

def list_routes():
    """List all registered routes in the FastAPI app"""
    print("=== REGISTERED ROUTES ===")
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            for method in route.methods:
                if method != 'HEAD':  # Skip HEAD methods
                    routes.append(f"{method:8} {route.path}")
    
    # Sort routes for better readability
    routes.sort()
    
    for route in routes:
        print(route)
    
    print(f"\nTotal routes: {len(routes)}")
    
    # Check for specific problematic routes
    print("\n=== CHECKING SPECIFIC ROUTES ===")
    problematic_routes = [
        "/api/vendor/profile",
        "/api/vendor/dashboard/stats", 
        "/api/vendor/assigned-packages",
        "/api/ngo/profile",
        "/api/ngo/dashboard/stats"
    ]
    
    for prob_route in problematic_routes:
        found = any(prob_route in route for route in routes)
        status = "✅ FOUND" if found else "❌ MISSING"
        print(f"{status:10} {prob_route}")

if __name__ == "__main__":
    list_routes()