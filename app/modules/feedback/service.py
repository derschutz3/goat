from app.database import db
from .models import Feedback

class FeedbackService:
    def get_all_feedbacks(self):
        return Feedback.query.order_by(Feedback.created_at.desc()).all()
    
    def create_feedback(self, ticket_id, rating, comment):
        feedback = Feedback(ticket_id=ticket_id, rating=rating, comment=comment)
        db.session.add(feedback)
        db.session.commit()
        return feedback
