from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from .service import TicketService

chamados_bp = Blueprint('chamados', __name__)
service = TicketService()

@chamados_bp.route('/')
@login_required
def index():
    # stats = service.get_dashboard_stats()
    # return render_template('dashboard.html', active_page='dashboard', stats=stats)
    return redirect(url_for('chamados.listar_chamados'))

@chamados_bp.route('/novo', methods=['GET', 'POST'])
@login_required
def novo_chamado():
    if request.method == 'POST':
        service.create_ticket(request.form, current_user)
        flash('Chamado criado com sucesso!', 'success')
        return redirect(url_for('chamados.index'))
    
    stores = service.get_all_stores()
    categories = service.get_all_categories()
    technicians = service.get_all_technicians()
    return render_template('novo_chamado.html', stores=stores, categories=categories, technicians=technicians, active_page='novo_chamado')

@chamados_bp.route('/categorias', methods=['GET', 'POST'])
@login_required
def gerenciar_categorias():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
        
    if request.method == 'POST':
        name = request.form.get('name')
        if name:
            if service.create_category(name):
                flash('Categoria adicionada com sucesso!', 'success')
            else:
                flash('Categoria já existe!', 'warning')
        return redirect(url_for('chamados.gerenciar_categorias'))
        
    categories = service.get_all_categories()
    return render_template('categorias.html', categories=categories, active_page='categorias')

@chamados_bp.route('/categorias/excluir/<int:id>')
@login_required
def excluir_categoria(id):
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
        
    if service.delete_category(id):
        flash('Categoria removida com sucesso!', 'success')
    else:
        flash('Erro ao remover categoria.', 'danger')
    return redirect(url_for('chamados.gerenciar_categorias'))

@chamados_bp.route('/chamados')
@login_required
def listar_chamados():
    exclude_closed = request.args.get('exclude_closed') == 'true'
    tickets = service.list_tickets(exclude_closed=exclude_closed)
    stores = service.get_all_stores()
    return render_template('chamados.html', tickets=tickets, stores=stores, active_page='chamados', exclude_closed=exclude_closed)

@chamados_bp.route('/gerenciar')
@login_required
def gerenciar_chamados():
    if current_user.role not in ['admin', 'manager', 'supervisor', 'tecnico']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
        
    exclude_closed = request.args.get('exclude_closed') == 'true'
    tickets = service.list_tickets(exclude_closed=exclude_closed)
    technicians = service.get_all_technicians()
    stores = service.get_all_stores()
    categories = service.get_all_categories()
    return render_template('chamados.html', tickets=tickets, technicians=technicians, stores=stores, categories=categories, active_page='gerenciar_chamados', exclude_closed=exclude_closed)

@chamados_bp.route('/chamado/atualizar/<int:id>', methods=['POST'])
@login_required
def atualizar_chamado_geral(id):
    if current_user.role not in ['admin', 'manager', 'supervisor', 'tecnico']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
        
    if service.update_ticket_management(id, request.form):
        flash('Chamado atualizado com sucesso!', 'success')
    else:
        flash('Erro ao atualizar chamado.', 'danger')
        
    return redirect(url_for('chamados.gerenciar_chamados'))

@chamados_bp.route('/chamado/<int:id>')
@login_required
def ver_chamado(id):
    ticket = service.get_ticket(id)
    return render_template('chamado_detalhe.html', ticket=ticket)

@chamados_bp.route('/chamado/<int:id>/info', methods=['POST'])
@login_required
def atualizar_info(id):
    ticket = service.get_ticket(id)
    if not ticket:
        flash('Chamado não encontrado.', 'danger')
        return redirect(url_for('chamados.listar_chamados'))
        
    # Only technician assigned or admin/supervisor can edit info
    if current_user.role not in ['admin', 'supervisor'] and ticket.technician_id != current_user.id:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.ver_chamado', id=id))
        
    info = request.form.get('additional_info')
    if service.update_additional_info(id, info):
        flash('Informações atualizadas com sucesso!', 'success')
    else:
        flash('Erro ao atualizar informações.', 'danger')
        
    return redirect(url_for('chamados.ver_chamado', id=id))
