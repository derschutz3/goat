from app.database import db

class Store(db.Model):
    __tablename__ = 'stores'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    cnpj = db.Column(db.String(20))
    address = db.Column(db.String(200))
    manager = db.Column(db.String(100))
    
    def __repr__(self):
        return f'<Store {self.name}>'
