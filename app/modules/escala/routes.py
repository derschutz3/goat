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
    
    schedules = Schedule.query.all()
    for s in schedules:
        if s.day_of_week in schedule_map and s.user_id in schedule_map[s.day_of_week]:
            schedule_map[s.day_of_week][s.user_id].append(s.store)

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
    Schedule.query.filter_by(user_id=user_id, day_of_week=day).delete()
    
    # Add new schedules
    for store_id in store_ids:
        try:
            store_id = int(store_id)
        except ValueError:
            continue
            
        # Check if store is already assigned to ANYONE on THIS DAY (Unique constraint)
        # If so, remove it from the other person/slot
        existing_conflict = Schedule.query.filter_by(store_id=store_id, day_of_week=day).first()
        if existing_conflict:
            db.session.delete(existing_conflict)
            
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
    Schedule.query.delete()
    
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
    Schedule.query.delete()
    
    # 2. Get Techs
    from sqlalchemy import or_
    technicians = User.query.filter(or_(User.role == 'tecnico', User.is_technician == True)).all()
    
    if not technicians:
        flash('Nenhum técnico encontrado.', 'warning')
        return redirect(url_for('escala.index'))
        
    # 3. Calculate Store Loads (Tickets + Priorities)
    from app.modules.chamados.models import Ticket
    from sqlalchemy import func
    
    # Weights
    PRIORITY_WEIGHTS = {
        'critica': 5,
        'alta': 3,
        'media': 2,
        'baixa': 1
    }
    
    stores = Store.query.all()
    
    if not stores:
        flash('Nenhuma loja encontrada para gerar escala.', 'warning')
        return redirect(url_for('escala.index'))
        
    store_loads = []
    
    for store in stores:
        # Get open/recent tickets
        tickets = Ticket.query.filter(
            Ticket.store_id == store.id,
            Ticket.status.notin_(['fechado', 'resolvido'])
        ).all()
        
        load_score = 0
        for t in tickets:
            load_score += PRIORITY_WEIGHTS.get(t.priority, 1)
            
        # Base load (each store has minimum 1 point of effort)
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
    
    # Clear existing schedule before saving new one
    Schedule.query.delete()
    
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
