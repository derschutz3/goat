from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .service import SuggestionService

sugestoes_bp = Blueprint('sugestoes', __name__, url_prefix='/sugestoes')
service = SuggestionService()

@sugestoes_bp.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        if title and description:
            service.create_suggestion(title, description, current_user.id)
            flash('Sugestão enviada com sucesso!', 'success')
        else:
            flash('Título e descrição são obrigatórios.', 'error')
        return redirect(url_for('sugestoes.index'))
    
    suggestions = service.get_all_suggestions()
    return render_template('sugestoes.html', suggestions=suggestions, active_page='sugestoes')

@sugestoes_bp.route('/vote/<int:id>', methods=['POST'])
@login_required
def vote(id):
    if service.vote_suggestion(id):
        flash('Voto registrado!', 'success')
    else:
        flash('Erro ao votar.', 'error')
    return redirect(url_for('sugestoes.index'))
