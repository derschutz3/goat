from app.database import db
from .models import Tag

class TagRepository:
    def find_all(self):
        return Tag.query.order_by(Tag.name).all()

    def find_by_id(self, id):
        return db.session.get(Tag, id)

    def create(self, tag):
        db.session.add(tag)
        db.session.commit()
        return tag

    def update(self, tag):
        db.session.commit()
        return tag

    def delete(self, tag):
        db.session.delete(tag)
        db.session.commit()
