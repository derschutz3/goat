from app.database import db
from .models import Alert

class AlertService:
    def get_user_alerts(self, user_id):
        return Alert.query.filter_by(user_id=user_id).order_by(Alert.created_at.desc()).all()
    
    def mark_as_read(self, alert_id):
        alert = db.session.get(Alert, alert_id)
        if alert:
            alert.read = True
            db.session.commit()
            return True
        return False
    
    def create_alert(self, user_id, message, type='info'):
        alert = Alert(user_id=user_id, message=message, type=type)
        db.session.add(alert)
        db.session.commit()
        return alert
