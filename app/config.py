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
    # Check for SQLite
    if 'sqlite' in SQLALCHEMY_DATABASE_URI:
        SQLALCHEMY_ENGINE_OPTIONS['poolclass'] = NullPool
    # Check for Postgres (supports postgresql:// and postgres://)
    elif 'postgres' in SQLALCHEMY_DATABASE_URI:
        # Production pooling for Postgres
        # Use reasonable limits to avoid exhausting DB max connections
        SQLALCHEMY_ENGINE_OPTIONS['pool_size'] = 10  # Reduced from 20 to be safer
        SQLALCHEMY_ENGINE_OPTIONS['max_overflow'] = 20 # Reduced from 40
    else:
        # Fallback for other DBs (MySQL, etc) or if using NullPool is safer
        SQLALCHEMY_ENGINE_OPTIONS['pool_size'] = 10
        SQLALCHEMY_ENGINE_OPTIONS['max_overflow'] = 20
