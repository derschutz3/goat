from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required
from .service import StoreService

lojas_bp = Blueprint('lojas', __name__, url_prefix='/lojas')
store_service = StoreService()

@lojas_bp.route('/')
@login_required
def index():
    stats = store_service.get_all_stores_with_stats()
    return render_template('lojas_setores.html', active_page='lojas_setores', stats=stats)

@lojas_bp.route('/details/<path:name>')
@login_required
def details(name):
    data = store_service.get_store_details(name)
    return jsonify(data)

@lojas_bp.route('/save', methods=['POST'])
@login_required
def save():
    data = request.json
    name = data.get('name')
    cnpj = data.get('cnpj')
    address = data.get('address')
    manager = data.get('manager')
    
    if not name:
        return jsonify({'success': False, 'message': 'Nome da loja obrigatório'}), 400
        
    try:
        store_service.update_store(name, cnpj, address, manager)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@lojas_bp.route('/delete/<path:name>', methods=['POST'])
@login_required
def delete(name):
    try:
        if store_service.delete_store(name):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Loja não encontrada para exclusão.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
