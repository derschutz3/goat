from app.database import db
from .models import Suggestion

class SuggestionService:
    def get_all_suggestions(self):
        return Suggestion.query.order_by(Suggestion.votes.desc(), Suggestion.created_at.desc()).all()
    
    def create_suggestion(self, title, description, user_id):
        suggestion = Suggestion(title=title, description=description, user_id=user_id)
        db.session.add(suggestion)
        db.session.commit()
        return suggestion
    
    def vote_suggestion(self, suggestion_id):
        suggestion = db.session.get(Suggestion, suggestion_id)
        if suggestion:
            suggestion.votes += 1
            db.session.commit()
            return True
        return False
