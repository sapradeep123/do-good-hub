from app.database.connection import get_db
from app.models import User

def check_admin_users():
    db = next(get_db())
    try:
        users = db.query(User).filter(User.role == 'admin').all()
        print('Admin users:')
        for user in users:
            print(f'Email: {user.email}, Role: {user.role}, ID: {user.id}')
        
        # Also check all users to see what's available
        all_users = db.query(User).all()
        print('\nAll users:')
        for user in all_users:
            print(f'Email: {user.email}, Role: {user.role}, ID: {user.id}')
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_users()