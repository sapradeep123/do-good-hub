from app.main import app

print('Main app imported successfully')
print(f'Number of routes in app: {len(app.routes)}')

for route in app.routes:
    if hasattr(route, 'path'):
        methods = getattr(route, 'methods', 'N/A')
        print(f'Route: {route.path} - Methods: {methods}')
    else:
        print(f'Route: {route} - Type: {type(route)}')