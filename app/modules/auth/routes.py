from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User
from app.database import db
from . import auth_bp
from sqlalchemy import or_

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chamados.listar_chamados'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user:
            if user.check_password(password):
                login_user(user)
                return redirect(url_for('chamados.listar_chamados'))
        flash('Usuário ou senha inválidos', 'danger')
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/usuarios')
@login_required
def listar_usuarios():
    # Allow all users to access user management since it's an internal IT app
    search = request.args.get('search', '')
    query = User.query
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(User.username.ilike(search_term), User.email.ilike(search_term)))
        
    users = query.order_by(User.username).all()
    return render_template('usuarios.html', users=users, active_page='usuarios', active_tab='all', search=search)

@auth_bp.route('/usuarios/tecnicos')
@login_required
def listar_tecnicos():
    # Allow all users to access user management since it's an internal IT app
    search = request.args.get('search', '')
    query = User.query.filter_by(role='tecnico')
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(User.username.ilike(search_term), User.email.ilike(search_term)))
        
    users = query.order_by(User.username).all()
    return render_template('usuarios.html', users=users, active_page='usuarios', active_tab='tecnicos', search=search)

@auth_bp.route('/usuarios/novo', methods=['POST'])
@login_required
def criar_usuario():
    # Allow all users to manage users since it's an internal IT app
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    role = request.form.get('role')
    department = request.form.get('department')
    
    if User.query.filter_by(username=username).first():
        flash('Usuário já existe.', 'danger')
    else:
        user = User(username=username, email=email, role=role, department=department)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Usuário criado com sucesso!', 'success')
        
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

@auth_bp.route('/usuarios/editar/<int:id>', methods=['POST'])
@login_required
def editar_usuario(id):
    # Allow all users to manage users since it's an internal IT app
    user = db.session.get(User, id)
    if not user:
        flash('Usuário não encontrado.', 'danger')
        return redirect(url_for('auth.listar_usuarios'))
        
    role = request.form.get('role')
    department = request.form.get('department')
    new_password = request.form.get('password')
    
    # Only update role if provided (might be hidden in some forms)
    if role:
        if user.id == current_user.id and role != user.role:
            flash('Cuidado: Você alterou sua própria função.', 'warning')
        user.role = role
        
    if department:
        user.department = department
        
    if new_password and new_password.strip():
        user.set_password(new_password)
        flash('Senha atualizada com sucesso.', 'success')
        
    db.session.commit()
    flash('Usuário atualizado com sucesso.', 'success')
    
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

@auth_bp.route('/usuarios/excluir/<int:id>', methods=['POST'])
@login_required
def excluir_usuario(id):
    # Allow all users to manage users since it's an internal IT app
    user = db.session.get(User, id)
    if user:
        if user.id == current_user.id:
            flash('Você não pode excluir a si mesmo.', 'danger')
        else:
            db.session.delete(user)
            db.session.commit()
            flash('Usuário excluído com sucesso.', 'success')
    else:
        flash('Usuário não encontrado.', 'danger')
        
    return redirect(url_for('auth.listar_usuarios'))
