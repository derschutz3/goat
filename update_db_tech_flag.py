from app import create_app
from app.database import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Checking if 'is_technician' column exists in 'users' table...")
    try:
        # Try to select the column to see if it exists
        db.session.execute(text("SELECT is_technician FROM users LIMIT 1"))
        print("Column 'is_technician' already exists.")
    except Exception:
        print("Column 'is_technician' not found. Adding it...")
        # Rollback the failed transaction from the check
        db.session.rollback()
        
        try:
            # SQLite syntax (simplified, assumes SQLite for local dev based on previous context)
            # For Postgres, syntax is similar for ADD COLUMN
            db.session.execute(text("ALTER TABLE users ADD COLUMN is_technician BOOLEAN DEFAULT 0"))
            db.session.commit()
            print("Column 'is_technician' added successfully.")
            
            # Optional: Migrate existing technicians to have the flag
            print("Migrating existing technicians...")
            db.session.execute(text("UPDATE users SET is_technician = 1 WHERE role = 'tecnico'"))
            db.session.commit()
            print("Migration complete.")
            
        except Exception as e:
            print(f"Error adding column: {e}")
            db.session.rollback()
