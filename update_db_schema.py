from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Try to query the new column to see if it exists
        with db.engine.connect() as conn:
            conn.execute(text("SELECT profile_image FROM users LIMIT 1"))
            print("Column 'profile_image' already exists.")
    except Exception:
        print("Column 'profile_image' does not exist. Adding it...")
        try:
            with db.engine.connect() as conn:
                # Add column for SQLite (which seems to be the default dev DB based on config)
                # Note: SQLite has limited ALTER TABLE support, but ADD COLUMN is supported
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)"))
                conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
