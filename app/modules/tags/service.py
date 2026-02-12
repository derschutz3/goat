from .repository import TagRepository
from .models import Tag

class TagService:
    def __init__(self):
        self.repository = TagRepository()

    def get_all_tags(self):
        return self.repository.find_all()

    def create_tag(self, name, color):
        tag = Tag(name=name, color=color)
        return self.repository.create(tag)

    def delete_tag(self, id):
        tag = self.repository.find_by_id(id)
        if tag:
            self.repository.delete(tag)
            return True
        return False
