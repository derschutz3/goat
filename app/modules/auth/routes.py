from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User
from app.database import db
from . import auth_bp

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chamados.index'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user:
            if user.check_password(password):
                login_user(user)
                return redirect(url_for('chamados.index'))
        
        flash('Usuário ou senha inválidos', 'danger')
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/usuarios')
@login_required
def listar_usuarios():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
    users = User.query.all()
    return render_template('usuarios.html', users=users, active_page='usuarios', active_tab='all')

@auth_bp.route('/usuarios/tecnicos')
@login_required
def listar_tecnicos():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
    users = User.query.filter_by(role='tecnico').all()
    return render_template('usuarios.html', users=users, active_page='usuarios', active_tab='tecnicos')

@auth_bp.route('/usuarios/novo', methods=['POST'])
@login_required
def criar_usuario():
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        return redirect(url_for('chamados.index'))
        
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
        
    # Redirect back to the correct tab based on the role created
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

@auth_bp.route('/usuarios/editar/<int:id>', methods=['POST'])
@login_required
def editar_usuario(id):
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('chamados.index'))
    
    user = db.session.get(User, id)
    if not user:
        flash('Usuário não encontrado.', 'danger')
        return redirect(url_for('auth.listar_usuarios'))
        
    role = request.form.get('role')
    department = request.form.get('department')
    
    # Optional: Prevent changing own role if critical, but usually admins can
    if user.id == current_user.id and role != user.role:
        flash('Cuidado: Você alterou sua própria função.', 'warning')

    user.role = role
    user.department = department
    db.session.commit()
    
    flash('Usuário atualizado com sucesso.', 'success')
    
    # Redirect back to the correct tab based on the new role
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

@auth_bp.route('/usuarios/excluir/<int:id>', methods=['POST'])
@login_required
def excluir_usuario(id):
    if current_user.role not in ['admin', 'manager', 'supervisor']:
        return redirect(url_for('chamados.index'))
        
    user = db.session.get(User, id)
    if user:
        if user.id == current_user.id:
            flash('Você não pode excluir a si mesmo.', 'warning')
        else:
            is_tecnico = (user.role == 'tecnico')
            db.session.delete(user)
            db.session.commit()
            flash('Usuário excluído com sucesso.', 'success')
            
            if is_tecnico:
                 return redirect(url_for('auth.listar_tecnicos'))
            
    return redirect(url_for('auth.listar_usuarios'))
