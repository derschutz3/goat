from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from .service import AlertService

alertas_bp = Blueprint('alertas', __name__, url_prefix='/alertas')
service = AlertService()

@alertas_bp.route('/')
@login_required
def index():
    alerts = service.get_user_alerts(current_user.id)
    return render_template('alertas.html', alerts=alerts, active_page='alertas')

@alertas_bp.route('/read/<int:id>')
@login_required
def mark_read(id):
    service.mark_as_read(id)
    return redirect(url_for('alertas.index'))
