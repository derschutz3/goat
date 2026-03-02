from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from app.database import db
from app.modules.timeline.models import TicketEvent
from .service import TicketService

chamados_bp = Blueprint('chamados', __name__)
service = TicketService()

def serialize_ticket(ticket):
    if not ticket:
        return None
    return {
        'id': ticket.id,
        'title': ticket.title,
        'description': ticket.description,
        'status': ticket.status,
        'priority': ticket.priority,
        'category': ticket.category,
        'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
        'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
        'due_date': ticket.due_date.isoformat() if ticket.due_date else None,
        'closed_at': ticket.closed_at.isoformat() if ticket.closed_at else None,
        'additional_info': ticket.additional_info,
        'attachment': ticket.attachment,
        'requester_id': ticket.requester_id,
        'technician_id': ticket.technician_id,
        'store_id': ticket.store_id,
        'store': ticket.store.name if ticket.store else None,
        'technician': ticket.technician.username if ticket.technician else None,
        'requester': ticket.requester.username if ticket.requester else None
    }

def serialize_event(event):
    return {
        'id': event.id,
        'ticket_id': event.ticket_id,
        'event_type': event.event_type,
        'description': event.description,
        'created_at': event.created_at.isoformat() if event.created_at else None,
        'user_id': event.user_id,
        'user': event.user.username if event.user else None
    }

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
        service.create_ticket(request.form, current_user, request.files)
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

@chamados_bp.route('/api/dashboard')
@login_required
def api_dashboard():
    stats = service.get_dashboard_stats()
    recent = [serialize_ticket(t) for t in stats.get('recent_tickets', [])]
    payload = {
        'open': stats.get('open', 0),
        'pending': stats.get('pending', 0),
        'overdue': stats.get('overdue', 0),
        'resolved_today': stats.get('resolved_today', 0),
        'recent_tickets': recent,
        'productivity': stats.get('productivity', []),
        'priority_counts': stats.get('priority_counts', {})
    }
    return jsonify(payload)

@chamados_bp.route('/api/chamados', methods=['GET', 'POST'])
@login_required
def api_chamados():
    if request.method == 'GET':
        exclude_closed = request.args.get('exclude_closed') == 'true'
        tickets = service.list_tickets(exclude_closed=exclude_closed)
        return jsonify([serialize_ticket(t) for t in tickets])

    data = request.get_json(silent=True)
    if not data:
        data = request.form
    title = data.get('title')
    description = data.get('description')
    if not title or not description:
        return jsonify({'error': 'Título e descrição são obrigatórios.'}), 400
    ticket = service.create_ticket(data, current_user, request.files)
    return jsonify(serialize_ticket(ticket)), 201

@chamados_bp.route('/api/chamados/<int:id>', methods=['GET', 'PUT'])
@login_required
def api_chamado(id):
    if request.method == 'GET':
        ticket = service.get_ticket(id)
        if not ticket:
            return jsonify({'error': 'Chamado não encontrado.'}), 404
        return jsonify(serialize_ticket(ticket))

    data = request.get_json(silent=True)
    if not data:
        data = request.form
    if not service.update_ticket_management(id, data):
        return jsonify({'error': 'Erro ao atualizar chamado.'}), 400
    ticket = service.get_ticket(id)
    if not ticket:
        return jsonify({'error': 'Chamado não encontrado.'}), 404
    return jsonify(serialize_ticket(ticket))

@chamados_bp.route('/api/chamados/<int:id>/events', methods=['GET', 'POST'])
@login_required
def api_chamado_events(id):
    ticket = service.get_ticket(id)
    if not ticket:
        return jsonify({'error': 'Chamado não encontrado.'}), 404

    if request.method == 'GET':
        events = TicketEvent.query.filter_by(ticket_id=id).order_by(TicketEvent.created_at.desc()).all()
        return jsonify([serialize_event(event) for event in events])

    data = request.get_json(silent=True)
    if not data:
        data = request.form
    text = data.get('text') or data.get('description')
    if not text:
        return jsonify({'error': 'Texto é obrigatório.'}), 400
    event = TicketEvent(ticket_id=id, event_type='comment', description=text, created_at=datetime.utcnow(), user_id=current_user.id)
    db.session.add(event)
    db.session.commit()
    return jsonify(serialize_event(event)), 201

@chamados_bp.route('/api/stores')
@login_required
def api_stores():
    stores = service.get_all_stores()
    return jsonify([{'id': store.id, 'name': store.name} for store in stores])

@chamados_bp.route('/api/categories')
@login_required
def api_categories():
    categories = service.get_all_categories()
    return jsonify([{'id': category.id, 'name': category.name} for category in categories])

@chamados_bp.route('/api/technicians')
@login_required
def api_technicians():
    technicians = service.get_all_technicians()
    return jsonify([{'id': tech.id, 'username': tech.username} for tech in technicians])

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
    return render_template('gerenciar_chamados.html', tickets=tickets, technicians=technicians, stores=stores, categories=categories, active_page='gerenciar_chamados', exclude_closed=exclude_closed)

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

@chamados_bp.route('/chamado/excluir/<int:id>', methods=['POST'])
@login_required
def excluir_chamado(id):
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.gerenciar_chamados'))

    if service.delete_ticket(id):
        flash('Chamado excluído com sucesso!', 'success')
    else:
        flash('Chamado não encontrado.', 'danger')

    return redirect(request.referrer or url_for('chamados.gerenciar_chamados'))

@chamados_bp.route('/chamado/<int:id>')
@login_required
def ver_chamado(id):
    ticket = service.get_ticket(id)
    return render_template('chamado_detalhe.html', ticket=ticket)

@chamados_bp.route('/chamado/<int:id>/upload', methods=['POST'])
@login_required
def upload_anexo(id):
    if 'attachment' not in request.files:
        flash('Nenhum arquivo selecionado.', 'warning')
        return redirect(url_for('chamados.ver_chamado', id=id))
        
    file = request.files['attachment']
    if file.filename == '':
        flash('Nenhum arquivo selecionado.', 'warning')
        return redirect(url_for('chamados.ver_chamado', id=id))
        
    if service.upload_attachment(id, file):
        flash('Anexo enviado com sucesso!', 'success')
    else:
        flash('Erro ao enviar anexo.', 'danger')
        
    return redirect(url_for('chamados.ver_chamado', id=id))

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
