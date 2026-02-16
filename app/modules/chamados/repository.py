from app.database import db
from .models import Ticket
from app.models import User

class TicketRepository:
    def create(self, ticket):
        db.session.add(ticket)
        db.session.commit()
        return ticket

    def find_all(self, filters=None):
        query = Ticket.query.options(
            db.joinedload(Ticket.store),
            db.joinedload(Ticket.technician),
            db.joinedload(Ticket.requester)
        )
        
        if filters:
            if 'department' in filters and filters['department']:
                query = query.join(User, Ticket.requester_id == User.id)\
                             .filter(User.department == filters['department'])
            
            if 'status' in filters and filters['status']:
                query = query.filter(Ticket.status == filters['status'])
            
            if filters.get('exclude_closed'):
                query = query.filter(Ticket.status.notin_(['resolvido', 'fechado', 'nao_resolvido']))

        return query.order_by(Ticket.created_at.desc()).all()

    def count_by_department(self):
        # Counts open tickets per department
        return db.session.query(User.department, db.func.count(Ticket.id))\
                         .join(Ticket, Ticket.requester_id == User.id)\
                         .filter(Ticket.status.notin_(['resolvido', 'fechado', 'nao_resolvido']))\
                         .group_by(User.department).all()

    def find_by_id(self, id):
        return db.session.get(Ticket, id)

    def update(self, ticket):
        db.session.commit()
        return ticket
    
    def delete(self, ticket):
        db.session.delete(ticket)
        db.session.commit()

    def count_by_status(self):
        return db.session.query(Ticket.status, db.func.count(Ticket.status)).group_by(Ticket.status).all()

    def count_by_priority(self):
        return db.session.query(Ticket.priority, db.func.count(Ticket.priority)).group_by(Ticket.priority).all()

    def count_overdue(self, now):
        return Ticket.query.filter(Ticket.due_date < now, Ticket.status.notin_(['resolvido', 'fechado', 'nao_resolvido'])).count()

    def count_resolved_today(self, today_start):
        return Ticket.query.filter(
            Ticket.status == 'resolvido',
            Ticket.updated_at >= today_start
        ).count()

    def get_recent(self, limit=5):
        return Ticket.query.options(
            db.joinedload(Ticket.store),
            db.joinedload(Ticket.technician)
        ).order_by(Ticket.created_at.desc()).limit(limit).all()

    def get_technician_productivity(self, today_start):
        from sqlalchemy import or_
        # Optimized with GROUP BY to avoid N+1 queries
        results = db.session.query(
            User.username, 
            db.func.count(Ticket.id)
        ).join(Ticket, Ticket.technician_id == User.id)\
         .filter(Ticket.status == 'resolvido', Ticket.updated_at >= today_start)\
         .filter(or_(User.role == 'tecnico', User.is_technician == True))\
         .group_by(User.username).all()
        
        stats = [{'name': r[0], 'count': r[1]} for r in results]
        return sorted(stats, key=lambda x: x['count'], reverse=True)

    def get_all_departments(self):
        return [r[0] for r in db.session.query(User.department).distinct().filter(User.department.isnot(None)).all()]
