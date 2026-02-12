from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from .service import TagService

tags_bp = Blueprint('tags', __name__, url_prefix='/tags')
service = TagService()

@tags_bp.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        name = request.form.get('name')
        color = request.form.get('color')
        if name and color:
            service.create_tag(name, color)
            flash('Tag criada com sucesso!', 'success')
        else:
            flash('Nome e cor são obrigatórios.', 'error')
        return redirect(url_for('tags.index'))
    
    tags = service.get_all_tags()
    return render_template('tags.html', tags=tags, active_page='tags')

@tags_bp.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete_tag(id):
    if service.delete_tag(id):
        flash('Tag removida com sucesso!', 'success')
    else:
        flash('Erro ao remover tag.', 'error')
    return redirect(url_for('tags.index'))
