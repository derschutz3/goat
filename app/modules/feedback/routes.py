from flask import Blueprint, render_template
from flask_login import login_required
from .service import FeedbackService

feedback_bp = Blueprint('feedback', __name__, url_prefix='/feedback')
service = FeedbackService()

@feedback_bp.route('/')
@login_required
def index():
    feedbacks = service.get_all_feedbacks()
    return render_template('feedback.html', feedbacks=feedbacks, active_page='feedback')
