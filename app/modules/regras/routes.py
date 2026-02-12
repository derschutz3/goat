from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from .service import RegrasService

regras_bp = Blueprint('regras', __name__, url_prefix='/regras')
service = RegrasService()

@regras_bp.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        # Placeholder for creation logic
        flash('Funcionalidade de criação de regras em desenvolvimento.', 'info')
        return redirect(url_for('regras.index'))
    
    rules = service.get_all_rules()
    return render_template('regras.html', rules=rules, active_page='regras')
