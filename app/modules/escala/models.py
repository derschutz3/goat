from app.database import db

class Schedule(db.Model):
    __tablename__ = 'schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False) # segunda, terca, quarta, quinta, sexta
    
    store = db.relationship('Store', backref=db.backref('schedules', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('schedules', lazy=True))
    
    __table_args__ = (
        db.UniqueConstraint('store_id', 'day_of_week', name='unique_store_day'),
    )

    def __repr__(self):
        return f'<Schedule {self.day_of_week} - {self.user.username} - {self.store.name}>'
