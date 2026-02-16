from app.modules.chamados.repository import TicketRepository
from datetime import datetime
from app.database import db
import os
from werkzeug.utils import secure_filename
from flask import current_app

class TicketService:

    def __init__(self):
        self.repository = TicketRepository()

    def get_all_stores(self):
        from app.modules.lojas.models import Store
        from app.utils import natural_sort_key
        stores = Store.query.all()
        return sorted(stores, key=lambda x: natural_sort_key(x.name))

    def get_all_categories(self):
        from .models import Category
        return Category.query.filter_by(active=True).order_by(Category.name).all()
        
    def create_category(self, name):
        from .models import Category
        if Category.query.filter_by(name=name).first():
            return False
        cat = Category(name=name)
        db.session.add(cat)
        db.session.commit()
        return True

    def delete_category(self, id):
        from .models import Category
        cat = Category.query.get(id)
        if cat:
            db.session.delete(cat)
            db.session.commit()
            return True
        return False

    def get_all_technicians(self):
        from app.models import User
        from sqlalchemy import or_
        return User.query.filter(or_(User.role == 'tecnico', User.is_technician == True)).all()

    def get_department_stats(self):
        # This might need to be updated to use Store model if needed, 
        # or kept as is if it relies on User.department (which is string).
        # Assuming we want stats by Store now:
        from app.modules.lojas.models import Store
        from .models import Ticket
        
        # Count tickets per store
        results = db.session.query(Store.name, db.func.count(Ticket.id))\
                         .join(Store, Ticket.store_id == Store.id)\
                         .filter(Ticket.status.notin_(['resolvido', 'fechado']))\
                         .group_by(Store.name).all()
        
        stats_dict = {r[0]: r[1] for r in results}
        
        # Get all stores to ensure 0 counts are included
        all_stores = Store.query.all()
        
        stats = []
        for store in all_stores:
             stats.append({'name': store.name, 'count': stats_dict.get(store.name, 0)})
        
        from app.utils import natural_sort_key
        return sorted(stats, key=lambda x: natural_sort_key(x['name']))
    
    def list_tickets(self, exclude_closed=False):
        filters = {}
        if exclude_closed:
            filters['exclude_closed'] = True
        return self.repository.find_all(filters)
    
    def get_ticket(self, id):
        return self.repository.find_by_id(id)

    def update_additional_info(self, id, info):
        ticket = self.repository.find_by_id(id)
        if ticket:
            ticket.additional_info = info
            self.repository.update(ticket)
            return True
        return False

    def upload_attachment(self, id, file):
        ticket = self.repository.find_by_id(id)
        if ticket and file and file.filename:
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S_')
            filename = timestamp + filename
            
            upload_folder = os.path.join(current_app.static_folder, 'uploads', 'attachments')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            file.save(os.path.join(upload_folder, filename))
            
            # If there was an old attachment, maybe delete it? 
            # For now, let's just overwrite the reference in DB.
            # Ideally, we should delete the old file to save space, but let's keep it simple for now.
            ticket.attachment = filename
            self.repository.update(ticket)
            return True
        return False

    def create_ticket(self, data, user, files=None):
        from .models import Ticket
        
        # Determine status
        status = data.get('status', 'novo')
        technician_id = data.get('technician_id')
        
        attachment_filename = None
        if files and 'attachment' in files:
            file = files['attachment']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Ensure unique filename to avoid overwrites (timestamp prefix)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S_')
                filename = timestamp + filename
                
                upload_folder = os.path.join(current_app.static_folder, 'uploads', 'attachments')
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                    
                file.save(os.path.join(upload_folder, filename))
                attachment_filename = filename

        # If technician is assigned but status is still 'novo', maybe auto-move to 'aberto'?
        # For now, just trust the user input.
        
        ticket = Ticket(
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority', 'media'),
            category=data.get('category'),
            status=status,
            store_id=data.get('store_id'),
            requester_id=user.id,
            technician_id=technician_id if technician_id else None,
            attachment=attachment_filename
        )
        return self.repository.create(ticket)
        
    def delete_ticket(self, id):
        ticket = self.repository.find_by_id(id)
        if ticket:
            self.repository.delete(ticket)
            return True
        return False
        
    def update_ticket_management(self, id, data):
        ticket = self.repository.find_by_id(id)
        if not ticket:
            return False
            
        # Update status
        if 'status' in data:
            new_status = data['status']
            ticket.status = new_status
            
            # Set closed_at if resolved/closed
            if new_status in ['resolvido', 'fechado'] and not ticket.closed_at:
                ticket.closed_at = datetime.utcnow()
            elif new_status not in ['resolvido', 'fechado']:
                ticket.closed_at = None
                
        # Update technician
        if 'technician_id' in data:
            tech_id = data['technician_id']
            ticket.technician_id = tech_id if tech_id else None

        # Update other fields
        if 'store_id' in data:
            store_id = data['store_id']
            ticket.store_id = store_id if store_id else None
            
        if 'priority' in data:
            ticket.priority = data['priority']
            
        if 'category' in data:
            ticket.category = data['category']
            
        if 'description' in data:
            ticket.description = data['description']

        if 'additional_info' in data:
            ticket.additional_info = data['additional_info']
            
        self.repository.update(ticket)
        return True
    
    def get_dashboard_stats(self):
        from datetime import datetime, timedelta
        
        status_counts = dict(self.repository.count_by_status())
        open_count = status_counts.get('novo', 0)
        pending_count = status_counts.get('em_analise', 0) + status_counts.get('aguardando_peca', 0)
        overdue_count = self.repository.count_overdue(datetime.utcnow())
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        resolved_today = self.repository.count_resolved_today(today_start)
        recent_tickets = self.repository.get_recent(limit=5)
        productivity = self.repository.get_technician_productivity(today_start)
        
        return {
            'open': open_count,
            'pending': pending_count,
            'overdue': overdue_count,
            'resolved_today': resolved_today,
            'recent_tickets': recent_tickets,
            'productivity': productivity,
            'priority_counts': dict(self.repository.count_by_priority())
        }
        

