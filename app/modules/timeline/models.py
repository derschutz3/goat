from app.database import db

class TicketEvent(db.Model):
    __tablename__ = 'ticket_events'
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer)
    event_type = db.Column(db.String(50))
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime)
