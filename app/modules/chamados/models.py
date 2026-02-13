from app.database import db
from datetime import datetime
from app.modules.tags.models import ticket_tags

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<Category {self.name}>'

class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='novo', index=True) # novo, aberto, pendente, resolvido, fechado
    priority = db.Column(db.String(20), default='media') # baixa, media, alta, critica
    category = db.Column(db.String(50))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    additional_info = db.Column(db.Text, nullable=True)
    attachment = db.Column(db.String(255), nullable=True)
    
    # Foreign Keys
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=True)
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], backref='tickets_requested')
    technician = db.relationship('User', foreign_keys=[technician_id], backref='tickets_assigned')
    store = db.relationship('Store', backref='tickets')
    tags = db.relationship('Tag', secondary=ticket_tags, backref=db.backref('tickets', lazy='dynamic'))

    def __repr__(self):
        return f'<Ticket {self.id}: {self.title}>'
