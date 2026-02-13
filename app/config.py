import os
from dotenv import load_dotenv
from sqlalchemy.pool import NullPool

# Carrega variáveis do arquivo .env se existir
load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-12345'
    # Use absolute path for SQLite database to avoid confusion
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, '..', 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload configuration
    UPLOAD_FOLDER = os.path.join(basedir, 'static', 'uploads', 'profiles')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16MB max limit

    # Database connection pool configuration
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 3600,   # Recycle connections every hour
        'pool_pre_ping': True   # Check connection health to avoid stale errors
    }
    
    # Configure pooling based on database type
    # Always default to NullPool for SQLite or if DB type is uncertain to prevent locking
    if 'sqlite' in SQLALCHEMY_DATABASE_URI or 'postgresql' not in SQLALCHEMY_DATABASE_URI:
        # SQLite handles concurrency poorly with pooling (file locking).
        # Using NullPool disables pooling, preventing "QueuePool limit" errors
        # and letting SQLite manage its own file locks.
        SQLALCHEMY_ENGINE_OPTIONS['poolclass'] = NullPool
    else:
        # Production pooling (Postgres/MySQL)
        SQLALCHEMY_ENGINE_OPTIONS['pool_size'] = 20
        SQLALCHEMY_ENGINE_OPTIONS['max_overflow'] = 40
