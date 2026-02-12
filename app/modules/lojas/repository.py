from app.database import db
from .models import Store

class StoreRepository:
    def find_all(self):
        return Store.query.all()
    
    def find_by_name(self, name):
        return Store.query.filter_by(name=name).first()
    
    def save(self, store):
        db.session.add(store)
        db.session.commit()
        return store

    def delete(self, store):
        db.session.delete(store)
        db.session.commit()
