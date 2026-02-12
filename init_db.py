from app import create_app, db
from app.models import User
from app.modules.chamados.models import Ticket
from app.modules.sla.models import SlaPolicy
from app.modules.timeline.models import TicketEvent
from app.modules.tags.models import Tag
from app.modules.feedback.models import Feedback
from app.modules.alertas.models import Alert
from app.modules.regras.models import AutomationRule
from app.modules.sugestoes.models import Suggestion
from app.modules.lojas.models import Store
from app.modules.sla.service import SlaService

app = create_app()

def init_db():
    with app.app_context():
        # Create tables
        db.create_all()
        print("Tables created successfully.")
        
        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                role='admin',
                department='IT'
            )
            admin.set_password('admin')
            db.session.add(admin)
            print("Admin user created (password: admin).")
        
        # Check if manager user exists
        manager = User.query.filter_by(username='gestor').first()
        if not manager:
            manager = User(
                username='gestor',
                email='gestor@example.com',
                role='manager',
                department='Management'
            )
            manager.set_password('gestor')
            db.session.add(manager)
            print("Manager user created (password: gestor).")

        # Check if supervisor user exists
        supervisor = User.query.filter_by(username='supervisor').first()
        if not supervisor:
            supervisor = User(
                username='supervisor',
                email='supervisor@example.com',
                role='supervisor',
                department='Management'
            )
            supervisor.set_password('supervisor')
            db.session.add(supervisor)
            print("Supervisor user created (password: supervisor).")
            
        db.session.commit()
            
        # Initialize Default SLA Policies
        sla_service = SlaService()
        if sla_service.create_default_policies():
            print("Default SLA Policies created.")
        else:
            print("SLA Policies already exist.")

        # Initialize Default Tags
        default_tags = [
            {'name': 'Hardware', 'color': '#6f42c1'},
            {'name': 'Software', 'color': '#0dcaf0'},
            {'name': 'Rede', 'color': '#20c997'},
            {'name': 'Impressora', 'color': '#fd7e14'},
            {'name': 'Urgente', 'color': '#dc3545'}
        ]
        
        for tag_data in default_tags:
            if not Tag.query.filter_by(name=tag_data['name']).first():
                tag = Tag(name=tag_data['name'], color=tag_data['color'])
                db.session.add(tag)
        
        db.session.commit()
        print("Default Tags checked/created.")

        # Initialize Default Stores
        default_stores = [
            "GSM1 - LAGOA", "GSM2 - PRAÇA", "GSM3 - CONDE", "GSM4 - IPANEMA", "GSM5 - COPA",
            "GSM6 - BARRAMARES", "GSM7 - ICARAI", "GSM8 - RECREIO", "GSM9 - NOVA IGUAÇU",
            "GSM10 - GILKA", "GSM11 - DARK/SPIRIT", "GSM12 - NA BRASA RECREIO",
            "GSM13 - SB FREGUESIA", "GSM14 - ABOLIÇÃO", "GSM15 - VENTANIA", "GSM16 - SB PEPE",
            "GSM17 - MANDALA", "GSM 200 - NA BRASA NI", "GSM201 - NA BRASA ABOLIÇÃO",
            "GSM18 - SB CAXIAS", "GSM19 - SÃO FRANCISCO", "GSM20 - BACKER", "GSM21 - URUGUAI",
            "GSM99 - ESCRITORIO", "GSMDD - FABRICA"
        ]

        for store_name in default_stores:
            if not Store.query.filter_by(name=store_name).first():
                store = Store(name=store_name)
                db.session.add(store)
        
        db.session.commit()
        print("Default Stores checked/created.")

if __name__ == '__main__':
    init_db()
