from flask import Flask, request
from .config import Config
from .database import db
from flask_login import LoginManager, current_user

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'info'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    # Import core models to ensure they are registered
    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))
        
    # Ensure database sessions are removed at the end of each request
    # This prevents connection leaks that cause "QueuePool limit" errors
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    # Global Login Requirement
    @app.before_request
    def require_login():
        # Allow access to static files, auth routes, and error pages
        if request.endpoint and \
           not request.endpoint.startswith('auth.') and \
           not request.endpoint.startswith('static') and \
           not current_user.is_authenticated:
            return login_manager.unauthorized()

    # Register Blueprints
    from app.modules.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.modules.chamados import chamados_bp
    app.register_blueprint(chamados_bp)
    
    from app.modules.timeline import timeline_bp
    app.register_blueprint(timeline_bp)

    from app.modules.sla import sla_bp
    app.register_blueprint(sla_bp)

    from app.modules.tags import tags_bp
    app.register_blueprint(tags_bp)

    from app.modules.checklist_fechamento import checklist_bp
    app.register_blueprint(checklist_bp)

    from app.modules.chamados_relacionados import related_tickets_bp
    app.register_blueprint(related_tickets_bp)

    from app.modules.fila_risco_sla import fila_risco_bp
    app.register_blueprint(fila_risco_bp)

    # from app.modules.feedback import feedback_bp
    # app.register_blueprint(feedback_bp)

    from app.modules.alertas import alertas_bp
    app.register_blueprint(alertas_bp)

    # from app.modules.regras import regras_bp
    # app.register_blueprint(regras_bp)

    from app.modules.sugestoes import sugestoes_bp
    app.register_blueprint(sugestoes_bp)

    from app.modules.lojas import lojas_bp
    app.register_blueprint(lojas_bp)

    from app.modules.escala import escala_bp
    app.register_blueprint(escala_bp)

    # Auto-Migration logic: Check and add missing columns on startup
    with app.app_context():
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("SELECT profile_image FROM users LIMIT 1"))
                except Exception:
                    # Column likely missing, attempt to add it
                    print("Auto-Migration: Adding 'profile_image' column to 'users' table...")
                    conn.rollback() # Reset transaction if needed (Postgres)
                    conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)"))
                    conn.commit()
                    print("Auto-Migration: Column added successfully.")
        except Exception as e:
            print(f"Auto-Migration Warning: Could not check/update database schema: {e}")

    return app
