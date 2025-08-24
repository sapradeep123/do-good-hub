try:
    from app.routes import auth
    print(f"Auth import successful")
    print(f"Auth router prefix: {auth.router.prefix}")
    print(f"Auth routes count: {len(auth.router.routes)}")
    
    for route in auth.router.routes:
        print(f"Auth route: {route.path} - {route.methods}")
        
except Exception as e:
    print(f"Error importing auth: {e}")
    import traceback
    traceback.print_exc()

try:
    from app.main import app
    print(f"\nMain app import successful")
    
    # Check if auth routes are in the main app
    auth_routes = [route for route in app.routes if '/api/auth' in str(route.path)]
    print(f"Auth routes in main app: {len(auth_routes)}")
    
    for route in auth_routes:
        print(f"Main app auth route: {route.path} - {route.methods}")
        
except Exception as e:
    print(f"Error importing main app: {e}")
    import traceback
    traceback.print_exc()