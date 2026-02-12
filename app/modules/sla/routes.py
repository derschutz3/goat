from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from .service import SlaService

sla_bp = Blueprint('sla', __name__, url_prefix='/sla')
service = SlaService()

@sla_bp.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        id = request.form.get('id')
        response_time = request.form.get('response_time')
        resolution_time = request.form.get('resolution_time')
        
        if service.update_policy(id, response_time, resolution_time):
            flash('Política de SLA atualizada com sucesso!', 'success')
        else:
            flash('Erro ao atualizar política.', 'error')
        return redirect(url_for('sla.index'))
    
    policies = service.get_all_policies()
    return render_template('sla_policies.html', policies=policies, active_page='sla')
