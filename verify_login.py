from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    print("Checking users in database...")
    users = User.query.all()
    for u in users:
        print(f"User: {u.username}, Role: {u.role}, Password Hash: {u.password_hash[:20]}...")
        
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print(f"Checking password 'admin' for user 'admin': {admin.check_password('admin')}")
    else:
        print("User 'admin' not found!")
