from app.database import db
from .models import SlaPolicy

class SlaService:
    def create_default_policies(self):
        defaults = [
            {'priority': 'baixa', 'response_time': 24, 'resolution_time': 48},
            {'priority': 'media', 'response_time': 8, 'resolution_time': 24},
            {'priority': 'alta', 'response_time': 4, 'resolution_time': 8},
            {'priority': 'critica', 'response_time': 1, 'resolution_time': 4}
        ]
        
        created = False
        for policy_data in defaults:
            policy = SlaPolicy.query.filter_by(priority=policy_data['priority']).first()
            if not policy:
                policy = SlaPolicy(**policy_data)
                db.session.add(policy)
                created = True
        
        if created:
            db.session.commit()
        return created

    def get_all_policies(self):
        return SlaPolicy.query.all()
        
    def update_policy(self, id, response_time, resolution_time):
        policy = db.session.get(SlaPolicy, id)
        if policy:
            try:
                response_time = int(response_time)
                resolution_time = int(resolution_time)
            except (TypeError, ValueError):
                return False
            policy.response_time = response_time
            policy.resolution_time = resolution_time
            db.session.commit()
            return True
        return False

    def calculate_due_date(self, priority):
        from datetime import datetime, timedelta
        policy = SlaPolicy.query.filter_by(priority=priority).first()
        if policy:
            return datetime.utcnow() + timedelta(hours=policy.resolution_time)
        return datetime.utcnow() + timedelta(hours=24) # Default fallback
