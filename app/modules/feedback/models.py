from app.database import db
from datetime import datetime

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False) # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    ticket = db.relationship('Ticket', backref=db.backref('feedback', uselist=False))

    def __repr__(self):
        return f'<Feedback Ticket {self.ticket_id}: {self.rating}>'
