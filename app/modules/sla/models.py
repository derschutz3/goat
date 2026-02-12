from app.database import db

class SlaPolicy(db.Model):
    __tablename__ = 'sla_policies'
    id = db.Column(db.Integer, primary_key=True)
    priority = db.Column(db.String(20))
    response_time = db.Column(db.Integer)
    resolution_time = db.Column(db.Integer)
