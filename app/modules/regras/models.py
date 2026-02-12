from app.database import db
from datetime import datetime

class AutomationRule(db.Model):
    __tablename__ = 'automation_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    trigger_event = db.Column(db.String(50)) # create_ticket, update_ticket, etc.
    conditions = db.Column(db.Text) # JSON string or simple text
    actions = db.Column(db.Text) # JSON string or simple text
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<AutomationRule {self.name}>'
