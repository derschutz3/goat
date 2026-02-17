from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.database import db
from app.models import User
from app.modules.lojas.models import Store
from .models import Schedule
import random

escala_bp = Blueprint('escala', __name__, template_folder='../../templates')

@escala_bp.route('/escala')
@login_required
def index():
    if current_user.role not in ['admin', 'manager', 'supervisor', 'tecnico']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))

    # Fetch all technicians (Role='tecnico' OR is_technician=True)
    from sqlalchemy import or_
    technicians = User.query.filter(or_(User.role == 'tecnico', User.is_technician == True)).order_by(User.username).all()
    
    # Organize schedule by day -> technician -> stores
    days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
    
    # Structure: { 'segunda': { tech_id: [store1, store2], ... }, ... }
    schedule_map = {day: {tech.id: [] for tech in technicians} for day in days}
    
    schedules = Schedule.query.options(db.joinedload(Schedule.store)).all()
    for s in schedules:
        if s.day_of_week in schedule_map and s.user_id in schedule_map[s.day_of_week]:
            if s.store: # Check if store exists to avoid NoneType errors
                schedule_map[s.day_of_week][s.user_id].append(s.store)
            else:
                # Optionally delete orphan schedule
                # db.session.delete(s)
                pass

    # Sort stores within each cell
    from app.utils import natural_sort_key
    for day in days:
        for tech in technicians:
            schedule_map[day][tech.id].sort(key=lambda s: natural_sort_key(s.name))

    all_stores = Store.query.all()
    all_stores = sorted(all_stores, key=lambda x: natural_sort_key(x.name))

    return render_template('escala.html', 
                           technicians=technicians, 
                           days=days, 
                           schedule_map=schedule_map,
                           all_stores=all_stores,
                           active_page='escala')

@escala_bp.route('/escala/atualizar_celula', methods=['POST'])
@login_required
def atualizar_celula():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('escala.index'))
        
    user_id = request.form.get('user_id')
    day = request.form.get('day')
    store_ids = request.form.getlist('store_ids') # List of selected store IDs
    
    if not user_id or not day:
        flash('Dados inválidos.', 'danger')
        return redirect(url_for('escala.index'))
        
    # Remove existing schedules for this User + Day
    Schedule.query.filter_by(user_id=user_id, day_of_week=day).delete(synchronize_session=False)
    
    parsed_store_ids = []
    for store_id in store_ids:
        try:
            parsed_store_ids.append(int(store_id))
        except ValueError:
            continue
    
    if parsed_store_ids:
        existing_conflicts = Schedule.query.filter(
            Schedule.day_of_week == day,
            Schedule.store_id.in_(parsed_store_ids)
        ).all()
        for conflict in existing_conflicts:
            db.session.delete(conflict)
        
        for store_id in parsed_store_ids:
            new_schedule = Schedule(
                store_id=store_id,
                user_id=user_id,
                day_of_week=day
            )
            db.session.add(new_schedule)
        
    db.session.commit()
    flash('Escala atualizada com sucesso!', 'success')
    return redirect(url_for('escala.index'))

@escala_bp.route('/escala/gerar', methods=['POST'])
@login_required
def gerar_escala():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('escala.index'))
    
    # Clear existing schedule
    Schedule.query.delete(synchronize_session=False)
    
    # Get Techs
    from sqlalchemy import or_
    technicians = User.query.filter(or_(User.role == 'tecnico', User.is_technician == True)).all()
    
    if not technicians:
        flash('Nenhum técnico encontrado para gerar escala. Crie usuários com cargo Técnico ou marque a opção "Atua como Técnico".', 'warning')
        return redirect(url_for('escala.index'))

    stores = Store.query.all()
    
    if not stores:
        flash('Nenhuma loja encontrada para gerar escala. Cadastre lojas primeiro.', 'warning')
        return redirect(url_for('escala.index'))

    days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
    
    # Distribute stores evenly among technicians
    random.shuffle(stores)
    
    # Split stores per technician
    tech_stores = {tech.id: [] for tech in technicians}
    for i, store in enumerate(stores):
        tech_index = i % len(technicians)
        tech_stores[technicians[tech_index].id].append(store)
        
    # Distribute each tech's stores across days
    for tech in technicians:
        my_stores = tech_stores[tech.id]
        for i, store in enumerate(my_stores):
            day_index = i % 5
            day = days[day_index]
            
            new_schedule = Schedule(
                store_id=store.id,
                user_id=tech.id,
                day_of_week=day
            )
            db.session.add(new_schedule)
            
    db.session.commit()
    flash('Escala gerada e otimizada com sucesso!', 'success')
    return redirect(url_for('escala.index'))

@escala_bp.route('/escala/gerar-inteligente', methods=['POST'])
@login_required
def gerar_escala_inteligente():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('escala.index'))
    
    # 1. Clear existing schedule
    Schedule.query.delete(synchronize_session=False)
    
    # 2. Get Techs
    from sqlalchemy import or_
    technicians = User.query.filter(or_(User.role == 'tecnico', User.is_technician == True)).all()
    
    if not technicians:
        flash('Nenhum técnico encontrado.', 'warning')
        return redirect(url_for('escala.index'))
        
    # 3. Calculate Store Loads (Tickets + Priorities)
    from app.modules.chamados.models import Ticket
    from sqlalchemy import case, func
    
    stores = Store.query.all()
    
    if not stores:
        flash('Nenhuma loja encontrada para gerar escala.', 'warning')
        return redirect(url_for('escala.index'))
        
    weight_case = case(
        (Ticket.priority == 'critica', 5),
        (Ticket.priority == 'alta', 3),
        (Ticket.priority == 'media', 2),
        (Ticket.priority == 'baixa', 1),
        else_=1
    )
    
    load_rows = db.session.query(
        Ticket.store_id,
        func.sum(weight_case)
    ).filter(
        Ticket.status.notin_(['fechado', 'resolvido']),
        Ticket.store_id.isnot(None)
    ).group_by(Ticket.store_id).all()
    
    load_map = {store_id: load for store_id, load in load_rows}
    
    store_loads = []
    for store in stores:
        load_score = load_map.get(store.id) or 0
        load_score = max(load_score, 1)
        store_loads.append({
            'store': store,
            'load': load_score
        })
        
    # Sort stores by load (heaviest first)
    store_loads.sort(key=lambda x: x['load'], reverse=True)
    
    # 4. Greedy Distribution
    tech_loads = {tech.id: 0 for tech in technicians}
    tech_assignments = {tech.id: [] for tech in technicians}
    
    for item in store_loads:
        store = item['store']
        load = item['load']
        
        # Find tech with current lowest load
        min_tech_id = min(tech_loads, key=tech_loads.get)
        
        # Assign
        tech_assignments[min_tech_id].append(store)
        tech_loads[min_tech_id] += load
        
    # 5. Save Schedule (Distribute across week days)
    days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
    
    for tech in technicians:
        my_stores = tech_assignments[tech.id]
        # Shuffle slightly to mix hard tasks? Or keep sorted? 
        # Let's keep sorted to distribute hard ones across days if we use modulo
        
        for i, store in enumerate(my_stores):
            day_index = i % 5
            day = days[day_index]
            
            new_schedule = Schedule(
                store_id=store.id,
                user_id=tech.id,
                day_of_week=day
            )
            db.session.add(new_schedule)
            
    db.session.commit()
    flash('Escala Inteligente gerada com sucesso! (Baseada em volume e prioridade)', 'success')
    return redirect(url_for('escala.index'))
