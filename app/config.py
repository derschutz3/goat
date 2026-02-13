import os
from dotenv import load_dotenv

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
    # Fixes QueuePool limit overflow errors by increasing pool size
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,        # Increase baseline connections (default 5)
        'max_overflow': 40,     # Increase burst connections (default 10)
        'pool_recycle': 3600,   # Recycle connections every hour
        'pool_pre_ping': True   # Check connection health to avoid stale errors
    }
