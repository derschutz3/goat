from flask import render_template, redirect, url_for, flash, request, current_app, send_from_directory
from flask_login import login_user, logout_user, current_user, login_required
from app.models import User
from app.database import db
from . import auth_bp
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
import os
import uuid
from werkzeug.utils import secure_filename

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

def save_profile_image(file, username):
    filename = secure_filename(file.filename)
    safe_username = secure_filename(username or 'user')
    ext = os.path.splitext(filename)[1].lower()
    upload_folder = current_app.config.get('UPLOAD_FOLDER') or os.path.join(
        current_app.static_folder, 'uploads', 'profiles'
    )
    os.makedirs(upload_folder, exist_ok=True)
    unique_filename = f"{safe_username}_{uuid.uuid4().hex}{ext}"
    try:
        file.save(os.path.join(upload_folder, unique_filename))
        return unique_filename
    except Exception:
        return None

@auth_bp.route('/media/profiles/<path:filename>')
@login_required
def profile_image(filename):
    upload_folder = current_app.config.get('UPLOAD_FOLDER') or os.path.join(
        current_app.static_folder, 'uploads', 'profiles'
    )
    return send_from_directory(upload_folder, filename)

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
    master_username = current_app.config.get('MASTER_USERNAME')
    master_password = current_app.config.get('MASTER_PASSWORD')
    if master_username and master_password:
        query = query.filter(User.username != master_username)
    
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
    # Query for users who have role='tecnico' OR is_technician=True
    query = User.query.filter(or_(User.role == 'tecnico', User.is_technician == True))
    master_username = current_app.config.get('MASTER_USERNAME')
    master_password = current_app.config.get('MASTER_PASSWORD')
    if master_username and master_password:
        query = query.filter(User.username != master_username)
    
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
    is_technician = request.form.get('is_technician') == 'on'

    if not username or not email or not password:
        flash('Preencha usuário, email e senha.', 'danger')
        return redirect(url_for('auth.listar_usuarios'))
    
    # Enforce consistency: If role is 'tecnico', is_technician must be True
    if role == 'tecnico':
        is_technician = True
    
    if User.query.filter_by(username=username).first():
        flash('Usuário já existe.', 'danger')
    elif User.query.filter_by(email=email).first():
        flash('Email já cadastrado.', 'danger')
    else:
        user = User(username=username, email=email, role=role, department=department, is_technician=is_technician)
        user.set_password(password)
        
        # Handle profile image upload
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename != '' and allowed_file(file.filename):
                saved_path = save_profile_image(file, username)
                if saved_path:
                    user.profile_image = saved_path
                else:
                    flash('Erro ao salvar a imagem de perfil.', 'danger')

        try:
            db.session.add(user)
            db.session.commit()
            flash('Usuário criado com sucesso!', 'success')
        except IntegrityError:
            db.session.rollback()
            flash('Usuário ou email já cadastrado.', 'danger')
        except Exception:
            db.session.rollback()
            flash('Erro ao criar usuário.', 'danger')
        
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

def get_role_level(role):
    levels = {
        'admin': 100,
        'manager': 80,
        'supervisor': 60,
        'tecnico': 40,
        'user': 20
    }
    return levels.get(role, 0)

@auth_bp.context_processor
def utility_processor():
    def get_role_level_ctx(role):
        return get_role_level(role)
    master_username = current_app.config.get('MASTER_USERNAME')
    master_password = current_app.config.get('MASTER_PASSWORD')
    is_master = bool(master_username and master_password and current_user.is_authenticated and current_user.username == master_username)
    return dict(get_role_level=get_role_level_ctx, is_master=is_master)

@auth_bp.route('/usuarios/editar/<int:id>', methods=['POST'])
@login_required
def editar_usuario(id):
    # Allow all users to manage users since it's an internal IT app
    user = db.session.get(User, id)
    if not user:
        flash('Usuário não encontrado.', 'danger')
        return redirect(url_for('auth.listar_usuarios'))
        
    # Check permissions (Hierarchy: Admin > Manager > Supervisor > Technician > User)
    allowed = False
    if current_user.id == user.id:
        allowed = True
    elif current_user.role == 'admin':
        allowed = True
    else:
        current_level = get_role_level(current_user.role)
        target_level = get_role_level(user.role)
        if current_level > target_level:
            allowed = True
            
    if not allowed:
        flash('Você não tem permissão para editar este usuário.', 'danger')
        return redirect(url_for('auth.listar_usuarios'))
        
    master_username = current_app.config.get('MASTER_USERNAME')
    master_password = current_app.config.get('MASTER_PASSWORD')
    is_master = bool(master_username and master_password and current_user.username == master_username)
    is_admin = current_user.role == 'admin'

    role = request.form.get('role')
    department = request.form.get('department')
    is_technician = request.form.get('is_technician') == 'on'
    new_password = request.form.get('password')
    new_username = request.form.get('username')
    new_email = request.form.get('email')
    
    # Only update role if provided (might be hidden in some forms)
    if role:
        # Prevent non-admins from assigning roles higher than their own
        if current_user.role != 'admin':
            new_role_level = get_role_level(role)
            current_role_level = get_role_level(current_user.role)
            if new_role_level >= current_role_level and role != current_user.role:
                 flash('Você não pode promover um usuário a um cargo igual ou superior ao seu.', 'danger')
                 return redirect(url_for('auth.listar_usuarios'))

        if user.id == current_user.id and role != user.role:
            flash('Cuidado: Você alterou sua própria função.', 'warning')
        user.role = role
        
    if department is not None:
        user.department = department

    if (is_master or is_admin) and new_username:
        existing_user = User.query.filter(User.username == new_username, User.id != user.id).first()
        if existing_user:
            flash('Nome de usuário já cadastrado.', 'danger')
            return redirect(url_for('auth.listar_usuarios'))
        user.username = new_username

    if is_master and new_email:
        existing_email = User.query.filter(User.email == new_email, User.id != user.id).first()
        if existing_email:
            flash('Email já cadastrado.', 'danger')
            return redirect(url_for('auth.listar_usuarios'))
        user.email = new_email
        
    # Always update is_technician if we are in the edit flow
    # Enforce consistency: If role is 'tecnico', is_technician must be True
    if role == 'tecnico':
        is_technician = True
        
    user.is_technician = is_technician
        
    if new_password and new_password.strip():
        user.set_password(new_password)
        flash('Senha atualizada com sucesso.', 'success')

    if (is_master or is_admin) and 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '' and allowed_file(file.filename):
            saved_path = save_profile_image(file, user.username)
            if saved_path:
                user.profile_image = saved_path
            else:
                flash('Erro ao salvar a imagem de perfil.', 'danger')
        
    try:
        db.session.commit()
        flash('Usuário atualizado com sucesso.', 'success')
    except IntegrityError:
        db.session.rollback()
        flash('Usuário ou email já cadastrado.', 'danger')
    except Exception:
        db.session.rollback()
        flash('Erro ao atualizar usuário.', 'danger')
    
    if role == 'tecnico':
        return redirect(url_for('auth.listar_tecnicos'))
    return redirect(url_for('auth.listar_usuarios'))

@auth_bp.route('/perfil/atualizar', methods=['POST'])
@login_required
def atualizar_perfil():
    user = current_user
    
    # Update Password
    new_password = request.form.get('new_password')
    if new_password and new_password.strip():
        user.set_password(new_password)
        flash('Senha atualizada com sucesso.', 'success')
        
    # Update Photo
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '' and allowed_file(file.filename):
            saved_path = save_profile_image(file, user.username)
            if saved_path:
                user.profile_image = saved_path
                flash('Foto de perfil atualizada com sucesso.', 'success')
            else:
                flash('Erro ao salvar a imagem de perfil.', 'danger')
            
    db.session.commit()
    # Redirect back to where they came from or home
    return redirect(request.referrer or url_for('chamados.listar_chamados'))

@auth_bp.route('/usuarios/excluir/<int:id>', methods=['POST'])
@login_required
def excluir_usuario(id):
    user = db.session.get(User, id)
    if user:
        if user.id == current_user.id:
            flash('Você não pode excluir a si mesmo.', 'danger')
        else:
            # Check permissions
            allowed = False
            if current_user.role == 'admin':
                allowed = True
            else:
                current_level = get_role_level(current_user.role)
                target_level = get_role_level(user.role)
                if current_level > target_level:
                    allowed = True
            
            if allowed:
                db.session.delete(user)
                db.session.commit()
                flash('Usuário excluído com sucesso.', 'success')
            else:
                flash('Você não tem permissão para excluir este usuário.', 'danger')
    else:
        flash('Usuário não encontrado.', 'danger')
        
    return redirect(url_for('auth.listar_usuarios'))
